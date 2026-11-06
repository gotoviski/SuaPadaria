import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { buildDashboardMock } from '../../mocks/dashboardMock';
import Icon from '../../components/Icons/Icons';
import styles from './DashboardPage.module.css';

const ENDPOINTS = {
  sales: '/sales',
  productionOrders: '/production-orders',
  stockBalances: '/stock-balances',
  accountsPayable: '/accounts-payable',
  accountsReceivable: '/accounts-receivable',
  cashRegisters: '/cash-registers',
};

const PRODUCTION_STATUS = {
  OPEN: 'Aberta',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
};

const PAYMENT_METHOD = {
  CASH: 'Dinheiro',
  PIX: 'Pix',
  CREDIT_CARD: 'Cartão de crédito',
  DEBIT_CARD: 'Cartão de débito',
  MEAL_VOUCHER: 'Vale-refeição',
  STORE_CREDIT: 'Crediário',
  OTHER: 'Outro',
};

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const quantityFmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const timeFmt = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });
const dateFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' });
const weekdayFmt = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' });
const fullDateFmt = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const toNumber = (value) => Number(value) || 0;
const toDate = (value) => (value ? new Date(value) : null);

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function parseLocalDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mocked, setMocked] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const mock = buildDashboardMock();
    const entries = Object.entries(ENDPOINTS);
    const results = await Promise.allSettled(entries.map(([, path]) => api.get(path)));
    const next = {};
    let failed = 0;
    results.forEach((result, index) => {
      const key = entries[index][0];
      if (result.status === 'fulfilled') {
        next[key] = result.value;
      } else {
        next[key] = mock[key];
        failed += 1;
      }
    });
    setMocked(failed > 0);
    setData(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => {
    if (!data) return null;
    const now = new Date();

    const sales = data.sales ?? [];
    const todaySales = sales.filter((s) => {
      const d = toDate(s.saleDate);
      return d && isSameDay(d, now);
    });
    const salesTodayTotal = todaySales.reduce((sum, s) => sum + toNumber(s.total), 0);

    const week = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(now, i - 6);
      return { date, total: 0, count: 0 };
    });
    sales.forEach((s) => {
      const d = toDate(s.saleDate);
      const bucket = d && week.find((b) => isSameDay(b.date, d));
      if (bucket) {
        bucket.total += toNumber(s.total);
        bucket.count += 1;
      }
    });

    const activeOrders = (data.productionOrders ?? [])
      .filter((o) => o.status === 'OPEN' || o.status === 'IN_PROGRESS')
      .sort((a, b) => new Date(a.scheduledDate ?? 0) - new Date(b.scheduledDate ?? 0));

    const balanceByProduct = new Map();
    (data.stockBalances ?? []).forEach((b) => {
      const current = balanceByProduct.get(b.productId) ?? {
        productId: b.productId,
        productName: b.productName,
        quantity: 0,
      };
      current.quantity += toNumber(b.quantity);
      balanceByProduct.set(b.productId, current);
    });
    const lowStock = [...balanceByProduct.values()]
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 6);

    const in7Days = addDays(now, 7);
    const dues = [
      ...(data.accountsPayable ?? [])
        .filter((a) => a.status === 'PENDING')
        .map((a) => ({ ...a, kind: 'payable' })),
      ...(data.accountsReceivable ?? [])
        .filter((a) => a.status === 'PENDING')
        .map((a) => ({ ...a, kind: 'receivable' })),
    ]
      .map((a) => ({ ...a, due: parseLocalDate(a.dueDate) }))
      .filter((a) => a.due && a.due <= in7Days)
      .sort((a, b) => a.due - b.due)
      .slice(0, 8);

    const payableOverdue = (data.accountsPayable ?? []).filter(
      (a) => a.status === 'PENDING' && parseLocalDate(a.dueDate) < now
    );
    const receivablePending = (data.accountsReceivable ?? []).filter(
      (a) => a.status === 'PENDING'
    );
    const openRegisters = (data.cashRegisters ?? []).filter((r) => r.status === 'OPEN');

    const recentSales = [...sales]
      .sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate))
      .slice(0, 6);

    return {
      todaySales,
      salesTodayTotal,
      avgTicket: todaySales.length ? salesTodayTotal / todaySales.length : 0,
      week,
      activeOrders,
      lowStock,
      dues,
      payableOverdue,
      receivablePending,
      openRegisters,
      recentSales,
    };
  }, [data]);

  if (loading) {
    return (
      <div className={styles.state}>
        <p className={styles.stateText}>Carregando dashboard...</p>
      </div>
    );
  }

  const weekMax = Math.max(...summary.week.map((b) => b.total), 1);

  const kpis = [
    {
      label: 'Vendas hoje',
      value: currency.format(summary.salesTodayTotal),
      detail: `${summary.todaySales.length} ${
        summary.todaySales.length === 1 ? 'venda' : 'vendas'
      }`,
      icon: 'cart',
      to: '/vendas',
    },
    {
      label: 'Ticket médio',
      value: currency.format(summary.avgTicket),
      detail: 'nas vendas de hoje',
      icon: 'tag',
      to: '/vendas',
    },
    {
      label: 'Produção ativa',
      value: summary.activeOrders.length,
      detail: `${
        summary.activeOrders.filter((o) => o.status === 'IN_PROGRESS').length
      } em andamento`,
      icon: 'tool',
      to: '/producao/ordens',
    },
    {
      label: 'Caixas abertos',
      value: summary.openRegisters.length,
      detail:
        summary.openRegisters.length === 1
          ? '1 caixa em operação'
          : `${summary.openRegisters.length} caixas em operação`,
      icon: 'cash',
      to: '/vendas/caixa',
    },
    {
      label: 'A pagar vencido',
      value: currency.format(
        summary.payableOverdue.reduce((sum, a) => sum + toNumber(a.amount), 0)
      ),
      detail: `${summary.payableOverdue.length} ${
        summary.payableOverdue.length === 1 ? 'conta vencida' : 'contas vencidas'
      }`,
      icon: 'arrow-down-circle',
      to: '/financeiro/contas-a-pagar',
      tone: 'danger',
    },
    {
      label: 'A receber pendente',
      value: currency.format(
        summary.receivablePending.reduce((sum, a) => sum + toNumber(a.amount), 0)
      ),
      detail: `${summary.receivablePending.length} ${
        summary.receivablePending.length === 1 ? 'conta pendente' : 'contas pendentes'
      }`,
      icon: 'arrow-up-circle',
      to: '/financeiro/contas-a-receber',
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>{fullDateFmt.format(new Date())}</p>
        </div>
        <button type="button" className={styles.refreshBtn} onClick={load}>
          <Icon name="refresh" size={16} />
          Atualizar
        </button>
      </div>

      <div className={styles.kpis}>
        {kpis.map((kpi) => (
          <Link key={kpi.label} to={kpi.to} className={styles.kpi}>
            <div
              className={`${styles.kpiIcon} ${
                kpi.tone === 'danger' ? styles.kpiIconDanger : ''
              }`}
            >
              <Icon name={kpi.icon} size={20} strokeWidth={1.8} />
            </div>
            <div className={styles.kpiBody}>
              <span className={styles.kpiLabel}>{kpi.label}</span>
              <span className={styles.kpiValue}>{kpi.value}</span>
              <span className={styles.kpiDetail}>{kpi.detail}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className={styles.grid}>
        {/* <section className={`${styles.card} ${styles.span7}`}>
          <header className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Vendas dos últimos 7 dias</h2>
          </header>
          <div className={styles.chart}>
            {summary.week.map((bucket) => (
              <div key={bucket.date.toISOString()} className={styles.chartCol}>
                <span className={styles.chartValue}>
                  {bucket.total > 0 ? currency.format(bucket.total) : ''}
                </span>
                <div
                  className={styles.chartBar}
                  style={{ height: `${Math.max((bucket.total / weekMax) * 100, 2)}%` }}
                  title={`${dateFmt.format(bucket.date)}: ${currency.format(
                    bucket.total
                  )} (${bucket.count} ${bucket.count === 1 ? 'venda' : 'vendas'})`}
                />
                <span className={styles.chartLabel}>
                  {weekdayFmt.format(bucket.date).replace('.', '')}
                </span>
              </div>
            ))}
          </div>
        </section> */}

        <section className={`${styles.card} ${styles.span5}`}>
          <header className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Produção</h2>
            <Link to="/producao/ordens" className={styles.cardLink}>
              Ver ordens
            </Link>
          </header>
          {summary.activeOrders.length === 0 ? (
            <p className={styles.empty}>Nenhuma ordem de produção ativa.</p>
          ) : (
            <ul className={styles.list}>
              {summary.activeOrders.slice(0, 6).map((order) => (
                <li key={order.id} className={styles.listItem}>
                  <div className={styles.listMain}>
                    <span className={styles.listTitle}>{order.productName}</span>
                    <span className={styles.listSub}>
                      {quantityFmt.format(toNumber(order.plannedQuantity))} planejado
                      {order.scheduledDate
                        ? ` · ${dateFmt.format(toDate(order.scheduledDate))}`
                        : ''}
                    </span>
                  </div>
                  <span
                    className={`${styles.badge} ${
                      order.status === 'IN_PROGRESS' ? styles.badgeInfo : ''
                    }`}
                  >
                    {PRODUCTION_STATUS[order.status] ?? order.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={`${styles.card} ${styles.span7}`}>
          <header className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Últimas vendas</h2>
            <Link to="/vendas" className={styles.cardLink}>
              Ver vendas
            </Link>
          </header>
          {summary.recentSales.length === 0 ? (
            <p className={styles.empty}>Nenhuma venda registrada.</p>
          ) : (
            <ul className={styles.list}>
              {summary.recentSales.map((sale) => {
                const d = toDate(sale.saleDate);
                const methods = [...new Set((sale.payments ?? []).map((p) => p.method))];
                return (
                  <li key={sale.id} className={styles.listItem}>
                    <div className={styles.listMain}>
                      <span className={styles.listTitle}>
                        {sale.customerName || `Venda #${sale.id}`}
                      </span>
                      <span className={styles.listSub}>
                        {d ? `${dateFmt.format(d)} às ${timeFmt.format(d)}` : '—'}
                        {methods.length > 0 &&
                          ` · ${methods.map((m) => PAYMENT_METHOD[m] ?? m).join(', ')}`}
                      </span>
                    </div>
                    <span className={styles.listValue}>
                      {currency.format(toNumber(sale.total))}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className={`${styles.card} ${styles.span12}`}>
          <header className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <Icon name="alert" size={16} className={styles.alertIcon} />
              Menores saldos de estoque
            </h2>
            <Link to="/estoque/saldos" className={styles.cardLink}>
              Ver saldos
            </Link>
          </header>
          {summary.lowStock.length === 0 ? (
            <p className={styles.empty}>Nenhum saldo de estoque registrado.</p>
          ) : (
            <ul className={styles.list}>
              {summary.lowStock.map((item) => (
                <li key={item.productId} className={styles.listItem}>
                  <div className={styles.listMain}>
                    <span className={styles.listTitle}>{item.productName}</span>
                    {item.quantity <= 0 && (
                      <span className={styles.listSubDanger}>Esgotado</span>
                    )}
                  </div>
                  <span
                    className={`${styles.listValue} ${
                      item.quantity <= 0 ? styles.valueDanger : ''
                    }`}
                  >
                    {quantityFmt.format(item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={`${styles.card} ${styles.span12}`}>
          <header className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Vencimentos próximos (7 dias)</h2>
            <Link to="/financeiro/lancamentos" className={styles.cardLink}>
              Ver lançamentos
            </Link>
          </header>
          {summary.dues.length === 0 ? (
            <p className={styles.empty}>Nenhuma conta a pagar ou receber nos próximos 7 dias.</p>
          ) : (
            <ul className={`${styles.list} ${styles.dueList}`}>
              {summary.dues.map((due) => {
                const overdue = due.due < new Date() && !isSameDay(due.due, new Date());
                return (
                  <li key={`${due.kind}-${due.id}`} className={styles.listItem}>
                    <span
                      className={`${styles.badge} ${
                        due.kind === 'payable' ? styles.badgeDanger : styles.badgeInfo
                      }`}
                    >
                      {due.kind === 'payable' ? 'Pagar' : 'Receber'}
                    </span>
                    <div className={styles.listMain}>
                      <span className={styles.listTitle}>
                        {due.description || due.supplierName || due.customerName || 'Conta'}
                      </span>
                      <span className={styles.listSub}>
                        {due.kind === 'payable' ? due.supplierName : due.customerName}
                        {overdue && ' · vencida'}
                      </span>
                    </div>
                    <span className={styles.listSub}>{dateFmt.format(due.due)}</span>
                    <span
                      className={`${styles.listValue} ${overdue ? styles.valueDanger : ''}`}
                    >
                      {currency.format(toNumber(due.amount))}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
