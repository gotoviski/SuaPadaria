import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { buildFinanceiroMock } from '../../mocks/financeiroMock';
import Icon from '../../components/Icons/Icons';
import Modal from '../../components/Modal/Modal';
import styles from '../../styles/bsTheme.module.css';

const ENDPOINT = '/financial-accounts';

const TYPE_META = {
  CHECKING: { label: 'Conta corrente', badge: 'text-bg-primary' },
  SAVINGS: { label: 'Poupança', badge: 'text-bg-info' },
  CASH: { label: 'Caixa / dinheiro', badge: 'text-bg-warning' },
  OTHER: { label: 'Outra', badge: 'text-bg-secondary' },
};

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const parseAmount = (value) => Number(String(value).replace(',', '.')) || 0;

const EMPTY_FORM = {
  name: '',
  type: 'CHECKING',
  bankName: '',
  agency: '',
  accountNumber: '',
  initialBalance: '',
  notes: '',
  active: true,
};

export default function ContasFinanceirasPage() {
  const [data, setData] = useState(null);
  const [mocked, setMocked] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const load = useCallback(async () => {
    const mock = buildFinanceiroMock();
    try {
      const accounts = await api.get(ENDPOINT);
      setData(Array.isArray(accounts) ? accounts : mock.financialAccounts);
      setMocked(false);
    } catch {
      setData(mock.financialAccounts);
      setMocked(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    let list = [...(data ?? [])].sort((a, b) => String(a.name).localeCompare(String(b.name), 'pt-BR'));
    if (typeFilter) list = list.filter((a) => a.type === typeFilter);
    if (statusFilter === 'active') list = list.filter((a) => a.active !== false);
    if (statusFilter === 'inactive') list = list.filter((a) => a.active === false);
    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (a) =>
          (a.name ?? '').toLowerCase().includes(term) ||
          (a.bankName ?? '').toLowerCase().includes(term) ||
          (a.accountNumber ?? '').toLowerCase().includes(term) ||
          String(a.id).includes(term)
      );
    }
    return list;
  }, [data, search, typeFilter, statusFilter]);

  const stats = useMemo(() => {
    const list = data ?? [];
    const active = list.filter((a) => a.active !== false);
    return {
      totalBalance: active.reduce((s, a) => s + (Number(a.balance) || 0), 0),
      cashBalance: active
        .filter((a) => a.type === 'CASH')
        .reduce((s, a) => s + (Number(a.balance) || 0), 0),
      activeCount: active.length,
      inactiveCount: list.length - active.length,
    };
  }, [data]);

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(a) {
    setEditing(a);
    setForm({
      name: a.name ?? '',
      type: a.type ?? 'CHECKING',
      bankName: a.bankName ?? '',
      agency: a.agency ?? '',
      accountNumber: a.accountNumber ?? '',
      initialBalance: a.initialBalance != null ? String(a.initialBalance).replace('.', ',') : '',
      notes: a.notes ?? '',
      active: a.active !== false,
    });
    setError(null);
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  const formValid = form.name.trim() !== '';

  async function submit(e) {
    e.preventDefault();
    if (!formValid) return;
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      type: form.type,
      bankName: form.bankName.trim() || null,
      agency: form.agency.trim() || null,
      accountNumber: form.accountNumber.trim() || null,
      initialBalance: parseAmount(form.initialBalance),
      notes: form.notes.trim() || null,
      active: form.active,
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
        setData((prev) => {
          const patch = { ...payload, balance: payload.initialBalance };
          if (editing) {
            return prev.map((a) =>
              a.id === editing.id ? { ...a, ...patch, balance: a.balance ?? payload.initialBalance } : a
            );
          }
          const id = Math.max(0, ...prev.map((a) => Number(a.id) || 0)) + 1;
          return [{ id, createdAt: new Date().toISOString(), ...patch }, ...prev];
        });
      }
    } finally {
      setSaving(false);
      if (!failed) closeModal();
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setSaving(true);
    setDeleteError(null);
    let failed = false;
    try {
      await api.delete(`${ENDPOINT}/${deleting.id}`);
      await load();
    } catch (err) {
      if (mocked) {
        setData((prev) => prev.filter((a) => a.id !== deleting.id));
      } else {
        failed = true;
        setDeleteError(
          err?.status === 409
            ? 'Esta conta possui lançamentos vinculados e não pode ser excluída. Desative-a para deixar de usá-la.'
            : err?.message ?? 'Erro ao excluir conta.'
        );
      }
    } finally {
      setSaving(false);
      if (!failed) setDeleting(null);
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
          <h1 className="h4 mb-1 fw-semibold">Contas financeiras</h1>
          <p className="mb-0 text-muted small">Contas bancárias, caixa e formas de movimentação</p>
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
              <span className="text-muted small text-uppercase">Saldo total</span>
              <div className={`fs-5 fw-semibold ${stats.totalBalance < 0 ? 'text-danger' : 'text-success'}`}>
                {currency.format(stats.totalBalance)}
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Em caixa</span>
              <div className="fs-5 fw-semibold text-warning">{currency.format(stats.cashBalance)}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Contas ativas</span>
              <div className="fs-5 fw-semibold">{stats.activeCount}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Inativas</span>
              <div className="fs-5 fw-semibold text-secondary">{stats.inactiveCount}</div>
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
              placeholder="Buscar conta ou banco..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-select form-select-sm"
            style={{ maxWidth: 170 }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">Todos os tipos</option>
            {Object.entries(TYPE_META).map(([k, m]) => (
              <option key={k} value={k}>{m.label}</option>
            ))}
          </select>
          <select
            className="form-select form-select-sm"
            style={{ maxWidth: 150 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todas</option>
            <option value="active">Ativas</option>
            <option value="inactive">Inativas</option>
          </select>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Nº</th>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Banco</th>
                <th>Agência / Conta</th>
                <th className="text-end">Saldo</th>
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
                rows.map((a) => {
                  const meta = TYPE_META[a.type] ?? TYPE_META.OTHER;
                  const balance = Number(a.balance) || 0;
                  return (
                    <tr key={a.id}>
                      <td className="fw-semibold">#{a.id}</td>
                      <td>
                        <div className="fw-medium">{a.name}</div>
                        {a.notes && <div className="text-muted small text-truncate" style={{ maxWidth: 260 }}>{a.notes}</div>}
                      </td>
                      <td>
                        <span className={`badge ${meta.badge}`}>{meta.label}</span>
                      </td>
                      <td>{a.bankName || '—'}</td>
                      <td className="text-nowrap">
                        {a.agency || a.accountNumber
                          ? `${a.agency ?? '—'} / ${a.accountNumber ?? '—'}`
                          : '—'}
                      </td>
                      <td className={`text-end fw-semibold ${balance < 0 ? 'text-danger' : ''}`}>
                        {currency.format(balance)}
                      </td>
                      <td>
                        {a.active !== false ? (
                          <span className="badge text-bg-success">Ativa</span>
                        ) : (
                          <span className="badge text-bg-secondary">Inativa</span>
                        )}
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            title="Editar"
                            onClick={() => openEdit(a)}
                          >
                            <Icon name="edit" size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            title="Excluir"
                            onClick={() => { setDeleteError(null); setDeleting(a); }}
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
          title={editing ? `Editar conta #${editing.id}` : 'Nova conta financeira'}
          icon="card"
          onClose={closeModal}
          footer={
            <>
              <button type="button" className="btn btn-outline-secondary" onClick={closeModal} disabled={saving}>
                Cancelar
              </button>
              <button type="submit" form="account-form" className="btn btn-primary" disabled={saving || !formValid}>
                {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar'}
              </button>
            </>
          }
        >
          <form id="account-form" onSubmit={submit}>
            {error && (
              <div className="alert alert-danger py-2 small" role="alert">{error}</div>
            )}
            <div className="row g-3 mb-3">
              <div className="col-md-8">
                <label htmlFor="fa-name" className="form-label">Nome *</label>
                <input
                  id="fa-name"
                  type="text"
                  className="form-control"
                  maxLength="255"
                  placeholder="Ex.: Banco principal, Caixa da loja"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  autoFocus
                />
              </div>
              <div className="col-md-4">
                <label htmlFor="fa-type" className="form-label">Tipo *</label>
                <select
                  id="fa-type"
                  className="form-select"
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  required
                >
                  {Object.entries(TYPE_META).map(([k, m]) => (
                    <option key={k} value={k}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label htmlFor="fa-bank" className="form-label">Banco</label>
                <input
                  id="fa-bank"
                  type="text"
                  className="form-control"
                  maxLength="255"
                  value={form.bankName}
                  onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
                />
              </div>
              <div className="col-md-3">
                <label htmlFor="fa-agency" className="form-label">Agência</label>
                <input
                  id="fa-agency"
                  type="text"
                  className="form-control"
                  maxLength="20"
                  value={form.agency}
                  onChange={(e) => setForm((f) => ({ ...f, agency: e.target.value }))}
                />
              </div>
              <div className="col-md-3">
                <label htmlFor="fa-number" className="form-label">Conta</label>
                <input
                  id="fa-number"
                  type="text"
                  className="form-control"
                  maxLength="30"
                  value={form.accountNumber}
                  onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="fa-balance" className="form-label">Saldo inicial</label>
                <div className="input-group">
                  <span className="input-group-text">R$</span>
                  <input
                    id="fa-balance"
                    type="text"
                    inputMode="decimal"
                    className="form-control"
                    placeholder="0,00"
                    value={form.initialBalance}
                    onChange={(e) => setForm((f) => ({ ...f, initialBalance: e.target.value }))}
                  />
                </div>
                {editing && (
                  <div className="form-text">
                    Saldo atual: {currency.format(Number(editing.balance) || 0)}
                  </div>
                )}
              </div>
              <div className="col-md-6 d-flex align-items-end">
                <div className="form-check form-switch mb-2">
                  <input
                    id="fa-active"
                    type="checkbox"
                    className="form-check-input"
                    checked={form.active}
                    onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                  />
                  <label htmlFor="fa-active" className="form-check-label">Conta ativa</label>
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="fa-notes" className="form-label">Observações</label>
              <textarea
                id="fa-notes"
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
          {deleteError && (
            <div className="alert alert-danger py-2 small" role="alert">{deleteError}</div>
          )}
          <p className="mb-0">
            Excluir a conta <strong>{deleting.name}</strong>
            {deleting.bankName ? ` (${deleting.bankName})` : ''}?
            Esta ação não pode ser desfeita.
          </p>
        </Modal>
      )}
    </div>
  );
}
