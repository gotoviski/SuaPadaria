import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { buildClientesMock } from '../../mocks/clientesMock';
import Icon from '../../components/Icons/Icons';
import Modal from '../../components/Modal/Modal';
import styles from '../../styles/bsTheme.module.css';

const ENDPOINT = '/customers';

const EMPTY_FORM = {
  name: '',
  phone: '',
  email: '',
  cpf: '',
  birthDate: '',
  zipCode: '',
  street: '',
  number: '',
  complement: '',
  district: '',
  city: '',
  state: '',
  notes: '',
  active: true,
};

const digitsOnly = (value) => String(value ?? '').replace(/\D/g, '');

function formatCpf(cpf) {
  const d = digitsOnly(cpf);
  if (d.length !== 11) return cpf || '—';
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function formatPhone(phone) {
  const d = digitsOnly(phone);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return phone || '—';
}

export default function ClientesPage() {
  const [customers, setCustomers] = useState(null);
  const [mocked, setMocked] = useState(false);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const list = await api.get(ENDPOINT);
      if (Array.isArray(list)) {
        setCustomers(list);
        setMocked(false);
        return;
      }
      throw new Error('unexpected');
    } catch {
      setCustomers(buildClientesMock());
      setMocked(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const list = [...(customers ?? [])].sort((a, b) =>
      (a.name ?? '').localeCompare(b.name ?? '', 'pt-BR')
    );
    const term = search.trim().toLowerCase();
    if (!term) return list;
    const termDigits = digitsOnly(term);
    return list.filter(
      (c) =>
        (c.name ?? '').toLowerCase().includes(term) ||
        (c.email ?? '').toLowerCase().includes(term) ||
        (termDigits && digitsOnly(c.phone).includes(termDigits)) ||
        (termDigits && digitsOnly(c.cpf).includes(termDigits))
    );
  }, [customers, search]);

  const stats = useMemo(() => {
    const list = customers ?? [];
    const active = list.filter((c) => c.active !== false).length;
    return { total: list.length, active, inactive: list.length - active };
  }, [customers]);

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(customer) {
    setEditing(customer);
    setForm({
      name: customer.name ?? '',
      phone: customer.phone ?? '',
      email: customer.email ?? '',
      cpf: customer.cpf ?? '',
      birthDate: customer.birthDate ?? '',
      zipCode: customer.zipCode ?? '',
      street: customer.street ?? '',
      number: customer.number ?? '',
      complement: customer.complement ?? '',
      district: customer.district ?? '',
      city: customer.city ?? '',
      state: customer.state ?? '',
      notes: customer.notes ?? '',
      active: customer.active !== false,
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

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      cpf: digitsOnly(form.cpf) || null,
      birthDate: form.birthDate || null,
      zipCode: form.zipCode.trim() || null,
      street: form.street.trim() || null,
      number: form.number.trim() || null,
      complement: form.complement.trim() || null,
      district: form.district.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim().toUpperCase() || null,
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
        setError(err?.message ?? 'Erro ao salvar cliente.');
      } else {
        setCustomers((prev) => {
          if (editing) {
            return prev.map((c) => (c.id === editing.id ? { ...c, ...payload } : c));
          }
          const id = Math.max(0, ...prev.map((c) => Number(c.id) || 0)) + 1;
          return [...prev, { id, createdAt: new Date().toISOString(), ...payload }];
        });
      }
    } finally {
      setSaving(false);
      if (!failed) closeModal();
    }
  }

  async function toggleActive(customer) {
    const next = !(customer.active !== false);
    const payload = {
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      cpf: customer.cpf,
      birthDate: customer.birthDate,
      zipCode: customer.zipCode,
      street: customer.street,
      number: customer.number,
      complement: customer.complement,
      district: customer.district,
      city: customer.city,
      state: customer.state,
      notes: customer.notes,
      active: next,
    };
    try {
      await api.put(`${ENDPOINT}/${customer.id}`, payload);
      await load();
    } catch {
      setMocked(true);
      setCustomers((prev) => prev.map((c) => (c.id === customer.id ? { ...c, active: next } : c)));
    }
  }

  if (!customers) {
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
          <h1 className="h4 mb-1 fw-semibold">Clientes</h1>
          <p className="mb-0 text-muted small">Cadastro e gerenciamento de clientes</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openNew}>
          <Icon name="plus" size={16} className="me-1" />
          Novo cliente
        </button>
      </div>

      {mocked && (
        <div className="alert alert-warning py-2 small" role="alert">
          API indisponível — exibindo dados de exemplo. As alterações são apenas locais.
        </div>
      )}

      <div className="row g-3 mb-3">
        <div className="col-6 col-lg-4">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Total</span>
              <div className="fs-5 fw-semibold">{stats.total} clientes</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-4">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Ativos</span>
              <div className="fs-5 fw-semibold text-success">{stats.active}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-4">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Inativos</span>
              <div className="fs-5 fw-semibold text-danger">{stats.inactive}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="input-group input-group-sm" style={{ maxWidth: 380 }}>
            <span className="input-group-text">
              <Icon name="search" size={14} />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por nome, telefone, CPF ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Nº</th>
                <th>Cliente</th>
                <th>Telefone</th>
                <th>CPF</th>
                <th>Cidade/UF</th>
                <th>Status</th>
                <th className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-4">
                    {search ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado.'}
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id}>
                    <td className="fw-semibold">#{c.id}</td>
                    <td>
                      <div className="fw-medium">{c.name}</div>
                      {c.email && <div className="text-muted small">{c.email}</div>}
                    </td>
                    <td>{formatPhone(c.phone)}</td>
                    <td>{formatCpf(c.cpf)}</td>
                    <td>
                      {c.city ? `${c.city}${c.state ? `/${c.state}` : ''}` : '—'}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          c.active !== false ? 'text-bg-success' : 'text-bg-secondary'
                        }`}
                      >
                        {c.active !== false ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          title="Editar"
                          onClick={() => openEdit(c)}
                        >
                          <Icon name="edit" size={14} />
                        </button>
                        <button
                          type="button"
                          className={`btn ${
                            c.active !== false ? 'btn-outline-danger' : 'btn-outline-success'
                          }`}
                          title={c.active !== false ? 'Desativar' : 'Reativar'}
                          onClick={() => toggleActive(c)}
                        >
                          <Icon name={c.active !== false ? 'x' : 'check'} size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <Modal
          title={editing ? `Editar cliente #${editing.id}` : 'Novo cliente'}
          icon="users"
          wide
          onClose={closeModal}
          footer={
            <>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={closeModal}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="customer-form"
                className="btn btn-primary"
                disabled={saving || !form.name.trim() || !form.phone.trim()}
              >
                {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar'}
              </button>
            </>
          }
        >
          <form id="customer-form" onSubmit={submit}>
            {error && (
              <div className="alert alert-danger py-2 small" role="alert">
                {error}
              </div>
            )}
            <h6 className="text-muted text-uppercase small fw-semibold mb-3">Dados do cliente</h6>
            <div className="row g-3 mb-3">
              <div className="col-md-8">
                <label htmlFor="c-name" className="form-label">
                  Nome *
                </label>
                <input
                  id="c-name"
                  type="text"
                  className="form-control"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  autoFocus
                />
              </div>
              <div className="col-md-4">
                <label htmlFor="c-phone" className="form-label">
                  Telefone *
                </label>
                <input
                  id="c-phone"
                  type="tel"
                  className="form-control"
                  placeholder="(00) 00000-0000"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-5">
                <label htmlFor="c-email" className="form-label">
                  E-mail
                </label>
                <input
                  id="c-email"
                  type="email"
                  className="form-control"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="col-md-4">
                <label htmlFor="c-cpf" className="form-label">
                  CPF
                </label>
                <input
                  id="c-cpf"
                  type="text"
                  inputMode="numeric"
                  className="form-control"
                  placeholder="Somente números"
                  maxLength="14"
                  value={form.cpf}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, cpf: digitsOnly(e.target.value).slice(0, 11) }))
                  }
                />
              </div>
              <div className="col-md-3">
                <label htmlFor="c-birth" className="form-label">
                  Nascimento
                </label>
                <input
                  id="c-birth"
                  type="date"
                  className="form-control"
                  value={form.birthDate}
                  onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))}
                />
              </div>
            </div>

            <h6 className="text-muted text-uppercase small fw-semibold mb-3">Endereço</h6>
            <div className="row g-3 mb-3">
              <div className="col-md-3">
                <label htmlFor="c-zip" className="form-label">
                  CEP
                </label>
                <input
                  id="c-zip"
                  type="text"
                  inputMode="numeric"
                  className="form-control"
                  placeholder="00000-000"
                  maxLength="9"
                  value={form.zipCode}
                  onChange={(e) => setForm((f) => ({ ...f, zipCode: e.target.value }))}
                />
              </div>
              <div className="col-md-7">
                <label htmlFor="c-street" className="form-label">
                  Logradouro
                </label>
                <input
                  id="c-street"
                  type="text"
                  className="form-control"
                  value={form.street}
                  onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
                />
              </div>
              <div className="col-md-2">
                <label htmlFor="c-number" className="form-label">
                  Número
                </label>
                <input
                  id="c-number"
                  type="text"
                  className="form-control"
                  value={form.number}
                  onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
                />
              </div>
              <div className="col-md-4">
                <label htmlFor="c-complement" className="form-label">
                  Complemento
                </label>
                <input
                  id="c-complement"
                  type="text"
                  className="form-control"
                  value={form.complement}
                  onChange={(e) => setForm((f) => ({ ...f, complement: e.target.value }))}
                />
              </div>
              <div className="col-md-4">
                <label htmlFor="c-district" className="form-label">
                  Bairro
                </label>
                <input
                  id="c-district"
                  type="text"
                  className="form-control"
                  value={form.district}
                  onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
                />
              </div>
              <div className="col-md-3">
                <label htmlFor="c-city" className="form-label">
                  Cidade
                </label>
                <input
                  id="c-city"
                  type="text"
                  className="form-control"
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                />
              </div>
              <div className="col-md-1">
                <label htmlFor="c-state" className="form-label">
                  UF
                </label>
                <input
                  id="c-state"
                  type="text"
                  className="form-control text-uppercase"
                  maxLength="2"
                  value={form.state}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                />
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="c-notes" className="form-label">
                Observações
              </label>
              <textarea
                id="c-notes"
                className="form-control"
                rows="2"
                maxLength="1000"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>

            <div className="form-check form-switch">
              <input
                id="c-active"
                type="checkbox"
                className="form-check-input"
                role="switch"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              />
              <label htmlFor="c-active" className="form-check-label">
                Cliente ativo
              </label>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
