import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { buildFinanceiroMock } from '../../mocks/financeiroMock';
import Icon from '../../components/Icons/Icons';
import Modal from '../../components/Modal/Modal';
import styles from '../../styles/bsTheme.module.css';

const ENDPOINT = '/accounts-payable';

const CATEGORY_LABEL = {
  SUPPLIES: 'Insumos',
  RENT: 'Aluguel',
  UTILITIES: 'Utilidades',
  PAYROLL: 'Folha',
  TAXES: 'Impostos',
  MAINTENANCE: 'Manutenção',
  SERVICES: 'Serviços',
  OTHER: 'Outros',
};

const STATUS_META = {
  PENDING: { label: 'Pendente', badge: 'text-bg-warning' },
  PAID: { label: 'Pago', badge: 'text-bg-success' },
  CANCELED: { label: 'Cancelado', badge: 'text-bg-secondary' },
};

const PAYMENT_LABEL = {
  CASH: 'Dinheiro',
  PIX: 'Pix',
  CREDIT_CARD: 'Crédito',
  DEBIT_CARD: 'Débito',
  MEAL_VOUCHER: 'Vale-refeição',
  STORE_CREDIT: 'Crediário',
  OTHER: 'Outro',
};

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const dateFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const parseAmount = (value) => Number(String(value).replace(',', '.')) || 0;
const todayInput = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => (d ? dateFmt.format(new Date(`${d}T00:00:00`)) : '—');

const EMPTY_FORM = {
  supplierId: '',
  description: '',
  category: 'SUPPLIES',
  amount: '',
  dueDate: '',
  notes: '',
};

const EMPTY_PAY = { paidDate: '', paymentMethod: 'PIX', financialAccountId: '' };

export default function ContasAPagarPage() {
  const [data, setData] = useState(null);
  const [mocked, setMocked] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [paying, setPaying] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [payForm, setPayForm] = useState(EMPTY_PAY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const mock = buildFinanceiroMock();
    const endpoints = {
      payables: ENDPOINT,
      suppliers: '/suppliers',
      financialAccounts: '/financial-accounts',
    };
    const entries = Object.entries(endpoints);
    const results = await Promise.allSettled(entries.map(([, path]) => api.get(path)));
    const next = {};
    let failed = 0;
    results.forEach((result, index) => {
      const key = entries[index][0];
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        next[key] = result.value;
      } else {
        next[key] = mock[key] ?? [];
        failed += 1;
      }
    });
    setMocked(failed > 0);
    setData(next);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    let list = [...(data?.payables ?? [])].sort((a, b) => {
      const rank = (p) => (p.status === 'PENDING' ? 0 : 1);
      return rank(a) - rank(b) || String(a.dueDate).localeCompare(String(b.dueDate));
    });
    if (statusFilter) list = list.filter((p) => p.status === statusFilter);
    if (categoryFilter) list = list.filter((p) => p.category === categoryFilter);
    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (p) =>
          (p.description ?? '').toLowerCase().includes(term) ||
          (p.supplierName ?? '').toLowerCase().includes(term) ||
          String(p.id).includes(term)
      );
    }
    return list;
  }, [data, search, statusFilter, categoryFilter]);

  const stats = useMemo(() => {
    const list = data?.payables ?? [];
    const pending = list.filter((p) => p.status === 'PENDING');
    const overdue = pending.filter((p) => p.overdue);
    return {
      pendingAmount: pending.reduce((s, p) => s + (Number(p.amount) || 0), 0),
      overdueCount: overdue.length,
      overdueAmount: overdue.reduce((s, p) => s + (Number(p.amount) || 0), 0),
      pendingCount: pending.length,
      paidCount: list.filter((p) => p.status === 'PAID').length,
    };
  }, [data]);

  function openNew() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, dueDate: todayInput() });
    setError(null);
    setModalOpen(true);
  }

  function openEdit(p) {
    setEditing(p);
    setForm({
      supplierId: p.supplierId ? String(p.supplierId) : '',
      description: p.description ?? '',
      category: p.category ?? 'SUPPLIES',
      amount: String(p.amount ?? '').replace('.', ','),
      dueDate: p.dueDate ?? '',
      notes: p.notes ?? '',
    });
    setError(null);
    setModalOpen(true);
  }

  function openPay(p) {
    setPaying(p);
    setPayForm({
      paidDate: todayInput(),
      paymentMethod: 'PIX',
      financialAccountId: data.financialAccounts[0] ? String(data.financialAccounts[0].id) : '',
    });
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  const formValid = form.description.trim() !== '' && parseAmount(form.amount) > 0 && form.dueDate !== '';

  async function submit(e) {
    e.preventDefault();
    if (!formValid) return;
    setSaving(true);
    setError(null);
    const payload = {
      supplierId: form.supplierId ? Number(form.supplierId) : null,
      description: form.description.trim(),
      category: form.category,
      amount: parseAmount(form.amount),
      dueDate: form.dueDate,
      paidDate: editing?.paidDate ?? null,
      status: editing?.status ?? 'PENDING',
      paymentMethod: editing?.paymentMethod ?? null,
      financialAccountId: editing?.financialAccountId ?? null,
      notes: form.notes.trim() || null,
    };
    let failed = false;
    try {
      if (editing) {
        await api.put(`${ENDPOINT}/${editing.id}`, payload);
      } else {
        await api.post(ENDPOINT, payload);
      }
      await load();
    } catch (err) {
      if (!mocked) {
        failed = true;
        setError(err?.message ?? 'Erro ao salvar conta.');
      } else {
        const supplierName =
          data.suppliers.find((s) => String(s.id) === form.supplierId)?.name ?? null;
        setData((prev) => {
          const patch = {
            ...payload,
            supplierName,
            overdue: payload.status === 'PENDING' && payload.dueDate < todayInput(),
            financialAccountName: null,
          };
          if (editing) {
            return { ...prev, payables: prev.payables.map((p) => (p.id === editing.id ? { ...p, ...patch } : p)) };
          }
          const id = Math.max(0, ...prev.payables.map((p) => Number(p.id) || 0)) + 1;
          return { ...prev, payables: [{ id, createdAt: new Date().toISOString(), ...patch }, ...prev.payables] };
        });
      }
    } finally {
      setSaving(false);
      if (!failed) closeModal();
    }
  }

  async function submitPay(e) {
    e.preventDefault();
    if (!paying) return;
    setSaving(true);
    const payload = {
      supplierId: paying.supplierId,
      description: paying.description,
      category: paying.category,
      amount: paying.amount,
      dueDate: paying.dueDate,
      paidDate: payForm.paidDate,
      status: 'PAID',
      paymentMethod: payForm.paymentMethod,
      financialAccountId: payForm.financialAccountId ? Number(payForm.financialAccountId) : null,
      notes: paying.notes,
    };
    try {
      await api.put(`${ENDPOINT}/${paying.id}`, payload);
      await load();
    } catch {
      setMocked(true);
      const accountName =
        data.financialAccounts.find((a) => String(a.id) === payForm.financialAccountId)?.name ?? null;
      setData((prev) => ({
        ...prev,
        payables: prev.payables.map((p) =>
          p.id === paying.id
            ? { ...p, status: 'PAID', paidDate: payForm.paidDate, paymentMethod: payForm.paymentMethod, financialAccountId: payload.financialAccountId, financialAccountName: accountName, overdue: false }
            : p
        ),
      }));
    } finally {
      setSaving(false);
      setPaying(null);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setSaving(true);
    try {
      await api.delete(`${ENDPOINT}/${deleting.id}`);
      await load();
    } catch {
      setMocked(true);
      setData((prev) => ({ ...prev, payables: prev.payables.filter((p) => p.id !== deleting.id) }));
    } finally {
      setSaving(false);
      setDeleting(null);
    }
  }

  if (!data) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-secondary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.bs}>
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <div>
          <h1 className="h4 mb-1 fw-semibold">Contas a pagar</h1>
          <p className="mb-0 text-muted small">Obrigações e pagamentos a fornecedores</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openNew}>
          <Icon name="plus" size={16} className="me-1" />
          Nova conta
        </button>
      </div>

      {mocked && (
        <div className="alert alert-warning py-2 small" role="alert">
          API indisponível — exibindo dados de exemplo. As alterações são apenas locais.
        </div>
      )}

      <div className="row g-3 mb-3">
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Em aberto</span>
              <div className="fs-5 fw-semibold text-warning">{currency.format(stats.pendingAmount)}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Vencidas</span>
              <div className={`fs-5 fw-semibold ${stats.overdueCount > 0 ? 'text-danger' : 'text-success'}`}>
                {stats.overdueCount} · {currency.format(stats.overdueAmount)}
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Pendentes</span>
              <div className="fs-5 fw-semibold">{stats.pendingCount}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Pagas</span>
              <div className="fs-5 fw-semibold text-success">{stats.paidCount}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex align-items-center gap-2 flex-wrap">
          <div className="input-group input-group-sm" style={{ maxWidth: 300 }}>
            <span className="input-group-text">
              <Icon name="search" size={14} />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar descrição ou fornecedor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-select form-select-sm"
            style={{ maxWidth: 160 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos os status</option>
            {Object.entries(STATUS_META).map(([k, m]) => (
              <option key={k} value={k}>{m.label}</option>
            ))}
          </select>
          <select
            className="form-select form-select-sm"
            style={{ maxWidth: 170 }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Todas as categorias</option>
            {Object.entries(CATEGORY_LABEL).map(([k, l]) => (
              <option key={k} value={k}>{l}</option>
            ))}
          </select>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Nº</th>
                <th>Descrição</th>
                <th>Fornecedor</th>
                <th>Categoria</th>
                <th>Vencimento</th>
                <th className="text-end">Valor</th>
                <th>Status</th>
                <th className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-4">
                    Nenhuma conta encontrada.
                  </td>
                </tr>
              ) : (
                rows.map((p) => {
                  const meta = STATUS_META[p.status] ?? STATUS_META.PENDING;
                  return (
                    <tr key={p.id}>
                      <td className="fw-semibold">#{p.id}</td>
                      <td>
                        <div className="fw-medium">{p.description}</div>
                        {p.status === 'PAID' && p.paidDate && (
                          <div className="text-muted small">
                            Pago em {fmtDate(p.paidDate)}
                            {p.paymentMethod ? ` · ${PAYMENT_LABEL[p.paymentMethod] ?? p.paymentMethod}` : ''}
                          </div>
                        )}
                      </td>
                      <td>{p.supplierName || '—'}</td>
                      <td>
                        <span className="badge text-bg-light border">
                          {CATEGORY_LABEL[p.category] ?? p.category}
                        </span>
                      </td>
                      <td className="text-nowrap">
                        {fmtDate(p.dueDate)}
                        {p.overdue && <span className="badge text-bg-danger ms-2">Vencida</span>}
                      </td>
                      <td className="text-end fw-semibold">{currency.format(Number(p.amount) || 0)}</td>
                      <td>
                        <span className={`badge ${meta.badge}`}>{meta.label}</span>
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          {p.status === 'PENDING' && (
                            <button
                              type="button"
                              className="btn btn-outline-success"
                              title="Baixar pagamento"
                              onClick={() => openPay(p)}
                            >
                              <Icon name="check" size={14} />
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            title="Editar"
                            onClick={() => openEdit(p)}
                          >
                            <Icon name="edit" size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            title="Excluir"
                            onClick={() => setDeleting(p)}
                          >
                            <Icon name="trash" size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <Modal
          title={editing ? `Editar conta #${editing.id}` : 'Nova conta a pagar'}
          icon="arrow-down-circle"
          onClose={closeModal}
          footer={
            <>
              <button type="button" className="btn btn-outline-secondary" onClick={closeModal} disabled={saving}>
                Cancelar
              </button>
              <button type="submit" form="payable-form" className="btn btn-primary" disabled={saving || !formValid}>
                {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar'}
              </button>
            </>
          }
        >
          <form id="payable-form" onSubmit={submit}>
            {error && (
              <div className="alert alert-danger py-2 small" role="alert">{error}</div>
            )}
            <div className="mb-3">
              <label htmlFor="ap-description" className="form-label">Descrição *</label>
              <input
                id="ap-description"
                type="text"
                className="form-control"
                maxLength="255"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                required
                autoFocus
              />
            </div>
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label htmlFor="ap-supplier" className="form-label">Fornecedor</label>
                <select
                  id="ap-supplier"
                  className="form-select"
                  value={form.supplierId}
                  onChange={(e) => setForm((f) => ({ ...f, supplierId: e.target.value }))}
                >
                  <option value="">Nenhum</option>
                  {data.suppliers.filter((s) => s.active !== false).map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label htmlFor="ap-category" className="form-label">Categoria</label>
                <select
                  id="ap-category"
                  className="form-select"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                >
                  {Object.entries(CATEGORY_LABEL).map(([k, l]) => (
                    <option key={k} value={k}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label htmlFor="ap-amount" className="form-label">Valor *</label>
                <div className="input-group">
                  <span className="input-group-text">R$</span>
                  <input
                    id="ap-amount"
                    type="text"
                    inputMode="decimal"
                    className="form-control"
                    placeholder="0,00"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="col-md-6">
                <label htmlFor="ap-due" className="form-label">Vencimento *</label>
                <input
                  id="ap-due"
                  type="date"
                  className="form-control"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="ap-notes" className="form-label">Observações</label>
              <textarea
                id="ap-notes"
                className="form-control"
                rows="2"
                maxLength="1000"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </form>
        </Modal>
      )}

      {paying && (
        <Modal
          title="Baixar pagamento"
          icon="check"
          onClose={() => !saving && setPaying(null)}
          footer={
            <>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setPaying(null)} disabled={saving}>
                Cancelar
              </button>
              <button type="submit" form="pay-form" className="btn btn-success" disabled={saving}>
                {saving ? 'Baixando...' : 'Confirmar baixa'}
              </button>
            </>
          }
        >
          <p className="small text-muted">
            {paying.description} — <strong>{currency.format(Number(paying.amount) || 0)}</strong>
          </p>
          <form id="pay-form" onSubmit={submitPay}>
            <div className="mb-3">
              <label htmlFor="pp-date" className="form-label">Data do pagamento</label>
              <input
                id="pp-date"
                type="date"
                className="form-control"
                value={payForm.paidDate}
                onChange={(e) => setPayForm((f) => ({ ...f, paidDate: e.target.value }))}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="pp-method" className="form-label">Forma de pagamento</label>
              <select
                id="pp-method"
                className="form-select"
                value={payForm.paymentMethod}
                onChange={(e) => setPayForm((f) => ({ ...f, paymentMethod: e.target.value }))}
              >
                {Object.entries(PAYMENT_LABEL).map(([k, l]) => (
                  <option key={k} value={k}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="pp-account" className="form-label">Conta financeira</label>
              <select
                id="pp-account"
                className="form-select"
                value={payForm.financialAccountId}
                onChange={(e) => setPayForm((f) => ({ ...f, financialAccountId: e.target.value }))}
              >
                <option value="">Não informar</option>
                {data.financialAccounts.filter((a) => a.active !== false).map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <Modal
          title="Excluir conta"
          icon="trash"
          onClose={() => !saving && setDeleting(null)}
          footer={
            <>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setDeleting(null)} disabled={saving}>
                Cancelar
              </button>
              <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={saving}>
                {saving ? 'Excluindo...' : 'Excluir'}
              </button>
            </>
          }
        >
          <p className="mb-0">
            Excluir <strong>{deleting.description}</strong> ({currency.format(Number(deleting.amount) || 0)})?
            Esta ação não pode ser desfeita.
          </p>
        </Modal>
      )}
    </div>
  );
}
