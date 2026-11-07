import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { buildFinanceiroMock } from '../../mocks/financeiroMock';
import Icon from '../../components/Icons/Icons';
import Modal from '../../components/Modal/Modal';
import styles from '../../styles/bsTheme.module.css';

const ENDPOINT = '/accounts-receivable';

const STATUS_META = {
  PENDING: { label: 'Pendente', badge: 'text-bg-warning' },
  RECEIVED: { label: 'Recebido', badge: 'text-bg-success' },
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
  customerId: '',
  description: '',
  amount: '',
  dueDate: '',
  notes: '',
};

const EMPTY_RECEIVE = { receivedDate: '', paymentMethod: 'PIX', financialAccountId: '' };

export default function ContasAReceberPage() {
  const [data, setData] = useState(null);
  const [mocked, setMocked] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [receiving, setReceiving] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [receiveForm, setReceiveForm] = useState(EMPTY_RECEIVE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const mock = buildFinanceiroMock();
    const endpoints = {
      receivables: ENDPOINT,
      customers: '/customers',
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
    let list = [...(data?.receivables ?? [])].sort((a, b) => {
      const rank = (r) => (r.status === 'PENDING' ? 0 : 1);
      return rank(a) - rank(b) || String(a.dueDate).localeCompare(String(b.dueDate));
    });
    if (statusFilter) list = list.filter((r) => r.status === statusFilter);
    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (r) =>
          (r.description ?? '').toLowerCase().includes(term) ||
          (r.customerName ?? '').toLowerCase().includes(term) ||
          String(r.id).includes(term)
      );
    }
    return list;
  }, [data, search, statusFilter]);

  const stats = useMemo(() => {
    const list = data?.receivables ?? [];
    const pending = list.filter((r) => r.status === 'PENDING');
    const overdue = pending.filter((r) => r.overdue);
    return {
      pendingAmount: pending.reduce((s, r) => s + (Number(r.amount) || 0), 0),
      overdueCount: overdue.length,
      overdueAmount: overdue.reduce((s, r) => s + (Number(r.amount) || 0), 0),
      pendingCount: pending.length,
      receivedCount: list.filter((r) => r.status === 'RECEIVED').length,
    };
  }, [data]);

  function openNew() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, dueDate: todayInput() });
    setError(null);
    setModalOpen(true);
  }

  function openEdit(r) {
    setEditing(r);
    setForm({
      customerId: r.customerId ? String(r.customerId) : '',
      description: r.description ?? '',
      amount: String(r.amount ?? '').replace('.', ','),
      dueDate: r.dueDate ?? '',
      notes: r.notes ?? '',
    });
    setError(null);
    setModalOpen(true);
  }

  function openReceive(r) {
    setReceiving(r);
    setReceiveForm({
      receivedDate: todayInput(),
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
      customerId: form.customerId ? Number(form.customerId) : null,
      description: form.description.trim(),
      amount: parseAmount(form.amount),
      dueDate: form.dueDate,
      receivedDate: editing?.receivedDate ?? null,
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
        const customerName =
          data.customers.find((c) => String(c.id) === form.customerId)?.name ?? null;
        setData((prev) => {
          const patch = {
            ...payload,
            customerName,
            overdue: payload.status === 'PENDING' && payload.dueDate < todayInput(),
            financialAccountName: null,
          };
          if (editing) {
            return { ...prev, receivables: prev.receivables.map((r) => (r.id === editing.id ? { ...r, ...patch } : r)) };
          }
          const id = Math.max(0, ...prev.receivables.map((r) => Number(r.id) || 0)) + 1;
          return { ...prev, receivables: [{ id, createdAt: new Date().toISOString(), ...patch }, ...prev.receivables] };
        });
      }
    } finally {
      setSaving(false);
      if (!failed) closeModal();
    }
  }

  async function submitReceive(e) {
    e.preventDefault();
    if (!receiving) return;
    setSaving(true);
    const payload = {
      settlementDate: receiveForm.receivedDate,
      paymentMethod: receiveForm.paymentMethod,
      financialAccountId: receiveForm.financialAccountId ? Number(receiveForm.financialAccountId) : null,
    };
    try {
      await api.post(`${ENDPOINT}/${receiving.id}/receive`, payload);
      await load();
    } catch {
      setMocked(true);
      const accountName =
        data.financialAccounts.find((a) => String(a.id) === receiveForm.financialAccountId)?.name ?? null;
      setData((prev) => ({
        ...prev,
        receivables: prev.receivables.map((r) =>
          r.id === receiving.id
            ? { ...r, status: 'RECEIVED', receivedDate: receiveForm.receivedDate, paymentMethod: receiveForm.paymentMethod, financialAccountId: payload.financialAccountId, financialAccountName: accountName, overdue: false }
            : r
        ),
      }));
    } finally {
      setSaving(false);
      setReceiving(null);
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
      setData((prev) => ({ ...prev, receivables: prev.receivables.filter((r) => r.id !== deleting.id) }));
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
          <h1 className="h4 mb-1 fw-semibold">Contas a receber</h1>
          <p className="mb-0 text-muted small">Recebíveis de clientes e vendas a prazo</p>
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
              <span className="text-muted small text-uppercase">Recebidas</span>
              <div className="fs-5 fw-semibold text-success">{stats.receivedCount}</div>
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
              placeholder="Buscar descrição ou cliente..."
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
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Nº</th>
                <th>Descrição</th>
                <th>Cliente</th>
                <th>Vencimento</th>
                <th className="text-end">Valor</th>
                <th>Status</th>
                <th className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-4">
                    Nenhuma conta encontrada.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const meta = STATUS_META[r.status] ?? STATUS_META.PENDING;
                  return (
                    <tr key={r.id}>
                      <td className="fw-semibold">#{r.id}</td>
                      <td>
                        <div className="fw-medium">{r.description}</div>
                        {r.status === 'RECEIVED' && r.receivedDate && (
                          <div className="text-muted small">
                            Recebido em {fmtDate(r.receivedDate)}
                            {r.paymentMethod ? ` · ${PAYMENT_LABEL[r.paymentMethod] ?? r.paymentMethod}` : ''}
                          </div>
                        )}
                      </td>
                      <td>{r.customerName || '—'}</td>
                      <td className="text-nowrap">
                        {fmtDate(r.dueDate)}
                        {r.overdue && <span className="badge text-bg-danger ms-2">Vencida</span>}
                      </td>
                      <td className="text-end fw-semibold">{currency.format(Number(r.amount) || 0)}</td>
                      <td>
                        <span className={`badge ${meta.badge}`}>{meta.label}</span>
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          {r.status === 'PENDING' && (
                            <button
                              type="button"
                              className="btn btn-outline-success"
                              title="Baixar recebimento"
                              onClick={() => openReceive(r)}
                            >
                              <Icon name="check" size={14} />
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            title="Editar"
                            onClick={() => openEdit(r)}
                          >
                            <Icon name="edit" size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            title="Excluir"
                            onClick={() => setDeleting(r)}
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
          title={editing ? `Editar conta #${editing.id}` : 'Nova conta a receber'}
          icon="arrow-up-circle"
          onClose={closeModal}
          footer={
            <>
              <button type="button" className="btn btn-outline-secondary" onClick={closeModal} disabled={saving}>
                Cancelar
              </button>
              <button type="submit" form="receivable-form" className="btn btn-primary" disabled={saving || !formValid}>
                {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar'}
              </button>
            </>
          }
        >
          <form id="receivable-form" onSubmit={submit}>
            {error && (
              <div className="alert alert-danger py-2 small" role="alert">{error}</div>
            )}
            <div className="mb-3">
              <label htmlFor="ar-description" className="form-label">Descrição *</label>
              <input
                id="ar-description"
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
                <label htmlFor="ar-customer" className="form-label">Cliente</label>
                <select
                  id="ar-customer"
                  className="form-select"
                  value={form.customerId}
                  onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))}
                >
                  <option value="">Nenhum</option>
                  {data.customers.filter((c) => c.active !== false).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label htmlFor="ar-amount" className="form-label">Valor *</label>
                <div className="input-group">
                  <span className="input-group-text">R$</span>
                  <input
                    id="ar-amount"
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
                <label htmlFor="ar-due" className="form-label">Vencimento *</label>
                <input
                  id="ar-due"
                  type="date"
                  className="form-control"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="ar-notes" className="form-label">Observações</label>
              <textarea
                id="ar-notes"
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

      {receiving && (
        <Modal
          title="Baixar recebimento"
          icon="check"
          onClose={() => !saving && setReceiving(null)}
          footer={
            <>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setReceiving(null)} disabled={saving}>
                Cancelar
              </button>
              <button type="submit" form="receive-form" className="btn btn-success" disabled={saving}>
                {saving ? 'Baixando...' : 'Confirmar baixa'}
              </button>
            </>
          }
        >
          <p className="small text-muted">
            {receiving.description} — <strong>{currency.format(Number(receiving.amount) || 0)}</strong>
          </p>
          <form id="receive-form" onSubmit={submitReceive}>
            <div className="mb-3">
              <label htmlFor="rr-date" className="form-label">Data do recebimento</label>
              <input
                id="rr-date"
                type="date"
                className="form-control"
                value={receiveForm.receivedDate}
                onChange={(e) => setReceiveForm((f) => ({ ...f, receivedDate: e.target.value }))}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="rr-method" className="form-label">Forma de recebimento</label>
              <select
                id="rr-method"
                className="form-select"
                value={receiveForm.paymentMethod}
                onChange={(e) => setReceiveForm((f) => ({ ...f, paymentMethod: e.target.value }))}
              >
                {Object.entries(PAYMENT_LABEL).map(([k, l]) => (
                  <option key={k} value={k}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="rr-account" className="form-label">Conta financeira</label>
              <select
                id="rr-account"
                className="form-select"
                value={receiveForm.financialAccountId}
                onChange={(e) => setReceiveForm((f) => ({ ...f, financialAccountId: e.target.value }))}
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
