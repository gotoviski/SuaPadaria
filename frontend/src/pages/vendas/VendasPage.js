import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../services/api';
import { buildVendasMock } from '../../mocks/vendasMock';
import Icon from '../../components/Icons/Icons';
import styles from './VendasPage.module.css';

const ENDPOINTS = {
  sales: '/sales',
  customers: '/customers',
  products: '/products',
  employees: '/employees',
  cashRegisters: '/cash-registers',
};

const PAYMENT_METHODS = [
  { key: 'CASH', label: 'Dinheiro' },
  { key: 'PIX', label: 'Pix' },
  { key: 'CREDIT_CARD', label: 'Crédito' },
  { key: 'DEBIT_CARD', label: 'Débito' },
  { key: 'MEAL_VOUCHER', label: 'Vale-refeição' },
  { key: 'STORE_CREDIT', label: 'Crediário' },
];

const PAYMENT_LABEL = Object.fromEntries(PAYMENT_METHODS.map((m) => [m.key, m.label]));

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const qtyFmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const dateTimeFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});
const clockFmt = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });

const toNumber = (value) => Number(value) || 0;

const normalize = (s) =>
  (s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

function isOpenPrice(product) {
  return product.manualPrice === true || normalize(product.name) === 'pao frances';
}

const itemKey = (item) => item.lineId ?? item.productId;

export default function VendasPage() {
  const [data, setData] = useState(null);
  const [mocked, setMocked] = useState(false);
  const [view, setView] = useState('pdv');

  const [cart, setCart] = useState([]);
  const [pricePrompt, setPricePrompt] = useState(null);
  const [customerId, setCustomerId] = useState('');
  const [method, setMethod] = useState('CASH');
  const [received, setReceived] = useState('');
  const [search, setSearch] = useState('');
  const [lastSale, setLastSale] = useState(null);
  const [localSales, setLocalSales] = useState([]);
  const [now, setNow] = useState(new Date());

  const searchRef = useRef(null);

  const load = useCallback(async () => {
    const mock = buildVendasMock();
    const entries = Object.entries(ENDPOINTS);
    const results = await Promise.allSettled(entries.map(([, path]) => api.get(path)));
    const next = {};
    let failed = 0;
    results.forEach((result, index) => {
      const key = entries[index][0];
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        next[key] = result.value;
      } else {
        next[key] = mock[key];
        failed += 1;
      }
    });
    setMocked(failed > 0);
    setData(next);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const products = useMemo(() => {
    const list = (data?.products ?? []).filter((p) => p.active !== false);
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter((p) => p.name.toLowerCase().includes(term));
  }, [data, search]);

  const openRegister = useMemo(
    () => (data?.cashRegisters ?? []).find((r) => r.status === 'OPEN'),
    [data]
  );

  const allSales = useMemo(
    () =>
      [...localSales, ...(data?.sales ?? [])].sort(
        (a, b) => new Date(b.saleDate) - new Date(a.saleDate)
      ),
    [localSales, data]
  );

  const subtotal = cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const itemCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const receivedNum = toNumber(received);
  const change = receivedNum - subtotal;
  const canFinalize =
    cart.length > 0 && (method !== 'CASH' || received === '' || receivedNum >= subtotal);

  function addToCart(product) {
    if (isOpenPrice(product)) {
      setPricePrompt({ product, value: '' });
      return;
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id && !i.openPrice);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id && !i.openPrice
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          unit: product.unit,
          unitPrice: toNumber(product.price),
          quantity: 1,
        },
      ];
    });
  }

  function confirmPrice() {
    if (!pricePrompt) return;
    const value = Number(String(pricePrompt.value).replace(',', '.'));
    if (!value || value <= 0) return;
    setCart((prev) => [
      ...prev,
      {
        lineId: `${pricePrompt.product.id}-${Date.now()}`,
        productId: pricePrompt.product.id,
        name: pricePrompt.product.name,
        unit: pricePrompt.product.unit,
        unitPrice: value,
        quantity: 1,
        openPrice: true,
      },
    ]);
    setPricePrompt(null);
    searchRef.current?.focus();
  }

  function changeQty(key, delta) {
    setCart((prev) =>
      prev
        .map((i) => (itemKey(i) === key ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  }

  function removeItem(key) {
    setCart((prev) => prev.filter((i) => itemKey(i) !== key));
  }

  function clearSale() {
    setCart([]);
    setCustomerId('');
    setReceived('');
    setMethod('CASH');
  }

  async function finalize() {
    if (!canFinalize) return;
    const customer = (data?.customers ?? []).find((c) => String(c.id) === customerId);
    const nextId =
      Math.max(0, ...allSales.map((s) => toNumber(s.id))) + 1;
    const sale = {
      id: nextId,
      customerId: customer?.id ?? null,
      customerName: customer?.name ?? null,
      employeeName: openRegister?.employeeName ?? 'Operador',
      cashRegisterId: openRegister?.id ?? null,
      saleDate: new Date().toISOString(),
      items: cart.map((i, idx) => ({
        id: idx + 1,
        productId: i.productId,
        productName: i.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.unitPrice * i.quantity,
      })),
      payments: [{ method, amount: subtotal }],
      total: subtotal,
      paidTotal: subtotal,
    };
    try {
      await api.post('/sales', sale);
    } catch {
      setMocked(true);
    }
    setLocalSales((prev) => [sale, ...prev]);
    setLastSale(sale);
    clearSale();
    searchRef.current?.focus();
  }

  function onSearchKeyDown(e) {
    if (e.key === 'Enter' && products.length > 0) {
      addToCart(products[0]);
      setSearch('');
    }
    if (e.key === 'F2') {
      e.preventDefault();
      finalize();
    }
  }

  if (!data) {
    return (
      <div className={styles.state}>
        <p className={styles.stateText}>Carregando PDV...</p>
      </div>
    );
  }

  return (
    <div className={styles.pdv}>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.title}>Frente de Caixa</h1>
          <p className={styles.subtitle}>
            {openRegister
              ? `Caixa ${String(openRegister.id).padStart(2, '0')} · ${
                  openRegister.employeeName ?? 'Operador'
                }`
              : 'Nenhum caixa aberto'}
          </p>
        </div>
        <div className={styles.topbarRight}>
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${view === 'pdv' ? styles.tabActive : ''}`}
              onClick={() => setView('pdv')}
            >
              <Icon name="cart" size={15} />
              PDV
            </button>
            <button
              type="button"
              className={`${styles.tab} ${view === 'historico' ? styles.tabActive : ''}`}
              onClick={() => setView('historico')}
            >
              <Icon name="clipboard" size={15} />
              Histórico
            </button>
          </div>
          <span className={styles.clock}>{clockFmt.format(now)}</span>
        </div>
      </div>

      {mocked && (
        <p className={styles.mockBanner}>
          API indisponível — exibindo dados de exemplo.
        </p>
      )}

      {lastSale && view === 'pdv' && (
        <div className={styles.toast}>
          <Icon name="check" size={16} />
          <span>
            Venda #{lastSale.id} finalizada — {currency.format(lastSale.total)}
          </span>
          <button
            type="button"
            className={styles.toastClose}
            onClick={() => setLastSale(null)}
            aria-label="Fechar"
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      )}

      {view === 'historico' ? (
        <section className={styles.card}>
          <header className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Últimas vendas</h2>
            <span className={styles.cardHint}>{allSales.length} registros</span>
          </header>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nº</th>
                  <th>Data/Hora</th>
                  <th>Cliente</th>
                  <th>Atendente</th>
                  <th>Itens</th>
                  <th>Pagamento</th>
                  <th className={styles.thRight}>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {allSales.map((sale) => {
                  const pending = toNumber(sale.paidTotal) < toNumber(sale.total);
                  const methods = [
                    ...new Set((sale.payments ?? []).map((p) => p.method)),
                  ];
                  return (
                    <tr key={sale.id}>
                      <td className={styles.tdId}>#{sale.id}</td>
                      <td>
                        {sale.saleDate
                          ? dateTimeFmt.format(new Date(sale.saleDate))
                          : '—'}
                      </td>
                      <td>{sale.customerName || 'Balcão'}</td>
                      <td>{sale.employeeName || '—'}</td>
                      <td>{(sale.items ?? []).length}</td>
                      <td>
                        {methods.length
                          ? methods.map((m) => PAYMENT_LABEL[m] ?? m).join(', ')
                          : '—'}
                      </td>
                      <td className={styles.tdRight}>
                        {currency.format(toNumber(sale.total))}
                      </td>
                      <td>
                        <span
                          className={`${styles.badge} ${
                            pending ? styles.badgeWarn : styles.badgeOk
                          }`}
                        >
                          {pending ? 'Pendente' : 'Pago'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <div className={styles.main}>
          <section className={styles.card}>
            <div className={styles.searchBox}>
              <Icon name="search" size={18} className={styles.searchIcon} />
              <input
                ref={searchRef}
                type="text"
                className={styles.searchInput}
                placeholder="Buscar produto ou bipar código... (Enter adiciona)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={onSearchKeyDown}
                autoFocus
              />
            </div>

            {products.length === 0 ? (
              <p className={styles.empty}>Nenhum produto encontrado.</p>
            ) : (
              <div className={styles.products}>
                {products.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={styles.product}
                    onClick={() => addToCart(p)}
                  >
                    <span className={styles.productName}>{p.name}</span>
                    {isOpenPrice(p) ? (
                      <span className={styles.productOpenPrice}>Valor aberto</span>
                    ) : (
                      <span className={styles.productPrice}>
                        {currency.format(toNumber(p.price))}
                        <span className={styles.productUnit}>/{p.unit}</span>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </section>

          <aside className={`${styles.card} ${styles.cartPanel}`}>
            <header className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <Icon name="cart" size={16} />
                Venda atual
              </h2>
              {cart.length > 0 && (
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={clearSale}
                >
                  <Icon name="trash" size={14} />
                  Limpar
                </button>
              )}
            </header>

            <select
              className={styles.select}
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">Balcão (sem cliente)</option>
              {(data.customers ?? [])
                .filter((c) => c.active !== false)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>

            <div className={styles.cartItems}>
              {cart.length === 0 ? (
                <p className={styles.empty}>
                  Toque em um produto para adicionar à venda.
                </p>
              ) : (
                cart.map((item) => (
                  <div key={itemKey(item)} className={styles.cartItem}>
                    <div className={styles.cartItemMain}>
                      <span className={styles.cartItemName}>{item.name}</span>
                      <span className={styles.cartItemSub}>
                        {item.openPrice
                          ? 'valor digitado'
                          : `${currency.format(item.unitPrice)}/${item.unit}`}
                      </span>
                    </div>
                    {item.openPrice ? (
                      <span className={styles.qtyValue}>
                        {qtyFmt.format(item.quantity)}
                      </span>
                    ) : (
                      <div className={styles.qty}>
                        <button
                          type="button"
                          className={styles.qtyBtn}
                          onClick={() => changeQty(itemKey(item), -1)}
                          aria-label="Diminuir"
                        >
                          −
                        </button>
                        <span className={styles.qtyValue}>
                          {qtyFmt.format(item.quantity)}
                        </span>
                        <button
                          type="button"
                          className={styles.qtyBtn}
                          onClick={() => changeQty(itemKey(item), 1)}
                          aria-label="Aumentar"
                        >
                          +
                        </button>
                      </div>
                    )}
                    <span className={styles.cartItemTotal}>
                      {currency.format(item.unitPrice * item.quantity)}
                    </span>
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => removeItem(itemKey(item))}
                      aria-label="Remover item"
                    >
                      <Icon name="x" size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className={styles.totals}>
              <div className={styles.totalRow}>
                <span>Itens</span>
                <span>{qtyFmt.format(itemCount)}</span>
              </div>
              <div className={styles.totalRow}>
                <span>Subtotal</span>
                <span>{currency.format(subtotal)}</span>
              </div>
              <div className={`${styles.totalRow} ${styles.totalBig}`}>
                <span>Total</span>
                <span>{currency.format(subtotal)}</span>
              </div>
            </div>

            <div className={styles.payGrid}>
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  className={`${styles.payBtn} ${
                    method === m.key ? styles.payBtnActive : ''
                  }`}
                  onClick={() => setMethod(m.key)}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {method === 'CASH' && (
              <div className={styles.cashRow}>
                <label className={styles.cashLabel}>
                  Valor recebido
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={styles.cashInput}
                    placeholder="0,00"
                    value={received}
                    onChange={(e) => setReceived(e.target.value)}
                  />
                </label>
                <div className={styles.changeBox}>
                  <span className={styles.changeLabel}>
                    {received !== '' && change < 0 ? 'Faltam' : 'Troco'}
                  </span>
                  <span
                    className={`${styles.changeValue} ${
                      received !== '' && change < 0 ? styles.changeNeg : ''
                    }`}
                  >
                    {currency.format(Math.abs(change))}
                  </span>
                </div>
              </div>
            )}

            <button
              type="button"
              className={styles.checkoutBtn}
              disabled={!canFinalize}
              onClick={finalize}
            >
              <Icon name="check" size={18} />
              Finalizar venda · F2
            </button>
          </aside>
        </div>
      )}

      {pricePrompt && (
        <div className={styles.overlay} onClick={() => setPricePrompt(null)}>
          <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.dialogTitle}>{pricePrompt.product.name}</h3>
            <p className={styles.dialogSub}>Digite o valor da venda</p>
            <div className={styles.dialogInputWrap}>
              <span className={styles.dialogCurrency}>R$</span>
              <input
                type="text"
                inputMode="decimal"
                className={styles.dialogInput}
                placeholder="0,00"
                value={pricePrompt.value}
                onChange={(e) =>
                  setPricePrompt((p) => ({ ...p, value: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmPrice();
                  if (e.key === 'Escape') setPricePrompt(null);
                }}
                autoFocus
              />
            </div>
            <div className={styles.dialogActions}>
              <button
                type="button"
                className={styles.dialogCancel}
                onClick={() => setPricePrompt(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.dialogConfirm}
                disabled={
                  !Number(String(pricePrompt.value).replace(',', '.')) ||
                  Number(String(pricePrompt.value).replace(',', '.')) <= 0
                }
                onClick={confirmPrice}
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
