import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { buildFinanceiroMock } from '../../mocks/financeiroMock';
import Icon from '../../components/Icons/Icons';
import Modal from '../../components/Modal/Modal';
import styles from '../../styles/bsTheme.module.css';

const ENDPOINT = '/financial-entries';

const TYPE_META = {
  ENTRY: { label: 'Entrada', badge: 'text-bg-success', sign: '+', text: 'text-success' },
  EXIT: { label: 'Saída', badge: 'text-bg-danger', sign: '−', text: 'text-danger' },
};

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const dateTimeFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
const parseAmount = (value) => Number(String(value).replace(',', '.')) || 0;
const fmtDateTime = (d) => (d ? dateTimeFmt.format(new Date(d)) : '—');

function nowLocalInput() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function originLabel(e) {
  if (e.accountPayableId) return `Conta a pagar #${e.accountPayableId}`;
  if (e.accountReceivableId) return `Conta a receber #${e.accountReceivableId}`;
  return 'Manual';
}

const EMPTY_FORM = {
  type: 'ENTRY',
  description: '',
  amount: '',
  entryDate: '',
  financialAccountId: '',
};

export default function LancamentosPage() {
  const [data, setData] = useState(null);
  const [mocked, setMocked] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [accountFilter, setAccountFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const mock = buildFinanceiroMock();
    const endpoints = {
      entries: ENDPOINT,
      financialAccounts: '/financial-accounts',
    };
    const list = Object.entries(endpoints);
    const results = await Promise.allSettled(list.map(([, path]) => api.get(path)));
    const next = {};
    let failed = 0;
    results.forEach((result, index) => {
      const key = list[index][0];
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
    let list = [...(data?.entries ?? [])].sort(
      (a, b) => new Date(b.entryDate ?? b.createdAt) - new Date(a.entryDate ?? a.createdAt)
    );
    if (typeFilter) list = list.filter((e) => e.type === typeFilter);
    if (accountFilter) list = list.filter((e) => String(e.financialAccountId) === accountFilter);
    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (e) =>
          (e.description ?? '').toLowerCase().includes(term) ||
          (e.financialAccountName ?? '').toLowerCase().includes(term) ||
          String(e.id).includes(term)
      );
    }
    return list;
  }, [data, search, typeFilter, accountFilter]);

  const stats = useMemo(() => {
    const list = data?.entries ?? [];
    const income = list
      .filter((e) => e.type === 'ENTRY')
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const expense = list
      .filter((e) => e.type === 'EXIT')
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    return {
      income,
      expense,
      net: income - expense,
      count: list.length,
    };
  }, [data]);

  function openNew() {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      entryDate: nowLocalInput(),
      financialAccountId: data.financialAccounts[0] ? String(data.financialAccounts[0].id) : '',
    });
    setError(null);
    setModalOpen(true);
  }

  function openEdit(e) {
    setEditing(e);
    setForm({
      type: e.type ?? 'ENTRY',
      description: e.description ?? '',
      amount: String(e.amount ?? '').replace('.', ','),
      entryDate: toLocalInput(e.entryDate),
      financialAccountId: e.financialAccountId ? String(e.financialAccountId) : '',
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

  const formValid =
    form.description.trim() !== '' &&
    parseAmount(form.amount) > 0 &&
    form.entryDate !== '' &&
    form.financialAccountId !== '';

  async function submit(e) {
    e.preventDefault();
    if (!formValid) return;
    setSaving(true);
    setError(null);
    const payload = {
      financialAccountId: Number(form.financialAccountId),
      type: form.type,
      amount: parseAmount(form.amount),
      description: form.description.trim(),
      accountPayableId: editing?.accountPayableId ?? null,
      accountReceivableId: editing?.accountReceivableId ?? null,
      entryDate: new Date(form.entryDate).toISOString(),
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
        setError(err?.message ?? 'Erro ao salvar lançamento.');
      } else {
        const accountName =
          data.financialAccounts.find((a) => String(a.id) === form.financialAccountId)?.name ?? null;
        setData((prev) => {
          const patch = { ...payload, financialAccountName: accountName };
          if (editing) {
            return {
              ...prev,
              entries: prev.entries.map((x) => (x.id === editing.id ? { ...x, ...patch } : x)),
            };
          }
          const id = Math.max(0, ...prev.entries.map((x) => Number(x.id) || 0)) + 1;
          return {
            ...prev,
            entries: [{ id, createdAt: new Date().toISOString(), ...patch }, ...prev.entries],
          };
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
    try {
      await api.delete(`${ENDPOINT}/${deleting.id}`);
      await load();
    } catch {
      setMocked(true);
      setData((prev) => ({ ...prev, entries: prev.entries.filter((e) => e.id !== deleting.id) }));
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
          <h1 className="h4 mb-1 fw-semibold">Lançamentos financeiros</h1>
          <p className="mb-0 text-muted small">Entradas e saídas registradas nas contas financeiras</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openNew}>
          <Icon name="plus" size={16} className="me-1" />
          Novo lançamento
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
              <span className="text-muted small text-uppercase">Entradas</span>
              <div className="fs-5 fw-semibold text-success">{currency.format(stats.income)}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Saídas</span>
              <div className="fs-5 fw-semibold text-danger">{currency.format(stats.expense)}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Resultado</span>
              <div className={`fs-5 fw-semibold ${stats.net < 0 ? 'text-danger' : 'text-success'}`}>
                {currency.format(stats.net)}
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Registros</span>
              <div className="fs-5 fw-semibold">{stats.count}</div>
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
              placeholder="Buscar descrição ou conta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-select form-select-sm"
            style={{ maxWidth: 150 }}
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
            style={{ maxWidth: 200 }}
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
          >
            <option value="">Todas as contas</option>
            {data.financialAccounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Nº</th>
                <th>Data</th>
                <th>Descrição</th>
                <th>Origem</th>
                <th>Conta</th>
                <th className="text-end">Valor</th>
                <th>Tipo</th>
                <th className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-4">
                    Nenhum lançamento encontrado.
                  </td>
                </tr>
              ) : (
                rows.map((e) => {
                  const meta = TYPE_META[e.type] ?? TYPE_META.ENTRY;
                  return (
                    <tr key={e.id}>
                      <td className="fw-semibold">#{e.id}</td>
                      <td className="text-nowrap text-muted">{fmtDateTime(e.entryDate)}</td>
                      <td>
                        <div className="fw-medium text-wrap" style={{ minWidth: 200 }}>{e.description}</div>
                      </td>
                      <td>
                        <span className="badge text-bg-light border">{originLabel(e)}</span>
                      </td>
                      <td>{e.financialAccountName || '—'}</td>
                      <td className={`text-end fw-semibold ${meta.text}`}>
                        {meta.sign} {currency.format(Number(e.amount) || 0)}
                      </td>
                      <td>
                        <span className={`badge ${meta.badge}`}>{meta.label}</span>
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            title="Editar"
                            onClick={() => openEdit(e)}
                          >
                            <Icon name="edit" size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            title="Excluir"
                            onClick={() => setDeleting(e)}
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
          title={editing ? `Editar lançamento #${editing.id}` : 'Novo lançamento'}
          icon="file"
          onClose={closeModal}
          footer={
            <>
              <button type="button" className="btn btn-outline-secondary" onClick={closeModal} disabled={saving}>
                Cancelar
              </button>
              <button type="submit" form="entry-form" className="btn btn-primary" disabled={saving || !formValid}>
                {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Lançar'}
              </button>
            </>
          }
        >
          <form id="entry-form" onSubmit={submit}>
            {error && (
              <div className="alert alert-danger py-2 small" role="alert">{error}</div>
            )}
            <div className="mb-3">
              <span className="form-label d-block">Tipo *</span>
              <div className="btn-group w-100" role="group">
                {Object.entries(TYPE_META).map(([k, m]) => (
                  <div key={k} className="btn-group w-50" role="group">
                    <input
                      type="radio"
                      className="btn-check"
                      name="entry-type"
                      id={`entry-type-${k}`}
                      checked={form.type === k}
                      onChange={() => setForm((f) => ({ ...f, type: k }))}
                    />
                    <label
                      className={`btn ${k === 'ENTRY' ? 'btn-outline-success' : 'btn-outline-danger'}`}
                      htmlFor={`entry-type-${k}`}
                    >
                      {m.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="mb-3">
              <label htmlFor="fe-description" className="form-label">Descrição *</label>
              <input
                id="fe-description"
                type="text"
                className="form-control"
                maxLength="500"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                required
                autoFocus
              />
            </div>
            <div className="row g-3">
              <div className="col-md-4">
                <label htmlFor="fe-amount" className="form-label">Valor *</label>
                <div className="input-group">
                  <span className="input-group-text">R$</span>
                  <input
                    id="fe-amount"
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
              <div className="col-md-4">
                <label htmlFor="fe-date" className="form-label">Data e hora *</label>
                <input
                  id="fe-date"
                  type="datetime-local"
                  className="form-control"
                  value={form.entryDate}
                  onChange={(e) => setForm((f) => ({ ...f, entryDate: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-4">
                <label htmlFor="fe-account" className="form-label">Conta financeira *</label>
                <select
                  id="fe-account"
                  className="form-select"
                  value={form.financialAccountId}
                  onChange={(e) => setForm((f) => ({ ...f, financialAccountId: e.target.value }))}
                  required
                >
                  <option value="">Selecione...</option>
                  {data.financialAccounts.filter((a) => a.active !== false).map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <Modal
          title="Excluir lançamento"
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
          {(deleting.accountPayableId || deleting.accountReceivableId) && (
            <div className="alert alert-warning py-2 small" role="alert">
              Este lançamento está vinculado a {originLabel(deleting).toLowerCase()}.
            </div>
          )}
          <p className="mb-0">
            Excluir <strong>{deleting.description}</strong> ({currency.format(Number(deleting.amount) || 0)})?
            Esta ação não pode ser desfeita.
          </p>
        </Modal>
      )}
    </div>
  );
}
