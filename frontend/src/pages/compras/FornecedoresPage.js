import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { buildComprasMock } from '../../mocks/comprasMock';
import Icon from '../../components/Icons/Icons';
import Modal from '../../components/Modal/Modal';
import styles from '../../styles/bsTheme.module.css';

const ENDPOINT = '/suppliers';

const EMPTY_FORM = {
  name: '',
  legalName: '',
  cnpj: '',
  contactName: '',
  phone: '',
  email: '',
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

function formatCnpj(cnpj) {
  const d = digitsOnly(cnpj);
  if (d.length !== 14) return cnpj || '—';
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

function formatPhone(phone) {
  const d = digitsOnly(phone);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return phone || '—';
}

export default function FornecedoresPage() {
  const [suppliers, setSuppliers] = useState(null);
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
        setSuppliers(list);
        setMocked(false);
        return;
      }
      throw new Error('unexpected');
    } catch {
      setSuppliers(buildComprasMock().suppliers);
      setMocked(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const list = [...(suppliers ?? [])].sort((a, b) =>
      (a.name ?? '').localeCompare(b.name ?? '', 'pt-BR')
    );
    const term = search.trim().toLowerCase();
    if (!term) return list;
    const termDigits = digitsOnly(term);
    return list.filter(
      (s) =>
        (s.name ?? '').toLowerCase().includes(term) ||
        (s.legalName ?? '').toLowerCase().includes(term) ||
        (s.contactName ?? '').toLowerCase().includes(term) ||
        (s.email ?? '').toLowerCase().includes(term) ||
        (termDigits && digitsOnly(s.cnpj).includes(termDigits)) ||
        (termDigits && digitsOnly(s.phone).includes(termDigits))
    );
  }, [suppliers, search]);

  const stats = useMemo(() => {
    const list = suppliers ?? [];
    const active = list.filter((s) => s.active !== false).length;
    return { total: list.length, active, inactive: list.length - active };
  }, [suppliers]);

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(supplier) {
    setEditing(supplier);
    setForm({
      name: supplier.name ?? '',
      legalName: supplier.legalName ?? '',
      cnpj: supplier.cnpj ?? '',
      contactName: supplier.contactName ?? '',
      phone: supplier.phone ?? '',
      email: supplier.email ?? '',
      zipCode: supplier.zipCode ?? '',
      street: supplier.street ?? '',
      number: supplier.number ?? '',
      complement: supplier.complement ?? '',
      district: supplier.district ?? '',
      city: supplier.city ?? '',
      state: supplier.state ?? '',
      notes: supplier.notes ?? '',
      active: supplier.active !== false,
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
      legalName: form.legalName.trim() || null,
      cnpj: digitsOnly(form.cnpj) || null,
      contactName: form.contactName.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
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
        setError(err?.message ?? 'Erro ao salvar fornecedor.');
      } else {
        setSuppliers((prev) => {
          if (editing) {
            return prev.map((s) => (s.id === editing.id ? { ...s, ...payload } : s));
          }
          const id = Math.max(0, ...prev.map((s) => Number(s.id) || 0)) + 1;
          return [...prev, { id, createdAt: new Date().toISOString(), ...payload }];
        });
      }
    } finally {
      setSaving(false);
      if (!failed) closeModal();
    }
  }

  async function toggleActive(supplier) {
    const next = !(supplier.active !== false);
    const payload = {
      name: supplier.name,
      legalName: supplier.legalName,
      cnpj: supplier.cnpj,
      contactName: supplier.contactName,
      phone: supplier.phone,
      email: supplier.email,
      zipCode: supplier.zipCode,
      street: supplier.street,
      number: supplier.number,
      complement: supplier.complement,
      district: supplier.district,
      city: supplier.city,
      state: supplier.state,
      notes: supplier.notes,
      active: next,
    };
    try {
      await api.put(`${ENDPOINT}/${supplier.id}`, payload);
      await load();
    } catch {
      setMocked(true);
      setSuppliers((prev) =>
        prev.map((s) => (s.id === supplier.id ? { ...s, active: next } : s))
      );
    }
  }

  if (!suppliers) {
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
          <h1 className="h4 mb-1 fw-semibold">Fornecedores</h1>
          <p className="mb-0 text-muted small">Cadastro e gerenciamento de fornecedores</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openNew}>
          <Icon name="plus" size={16} className="me-1" />
          Novo fornecedor
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
              <div className="fs-5 fw-semibold">{stats.total} fornecedores</div>
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
              placeholder="Buscar por nome, CNPJ, contato..."
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
                <th>Fornecedor</th>
                <th>CNPJ</th>
                <th>Contato</th>
                <th>Cidade/UF</th>
                <th>Status</th>
                <th className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-4">
                    {search ? 'Nenhum fornecedor encontrado.' : 'Nenhum fornecedor cadastrado.'}
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id}>
                    <td className="fw-semibold">#{s.id}</td>
                    <td>
                      <div className="fw-medium">{s.name}</div>
                      {s.legalName && <div className="text-muted small">{s.legalName}</div>}
                    </td>
                    <td>{formatCnpj(s.cnpj)}</td>
                    <td>
                      {s.contactName && <div>{s.contactName}</div>}
                      {s.phone && <div className="text-muted small">{formatPhone(s.phone)}</div>}
                      {!s.contactName && !s.phone && '—'}
                    </td>
                    <td>{s.city ? `${s.city}${s.state ? `/${s.state}` : ''}` : '—'}</td>
                    <td>
                      <span
                        className={`badge ${
                          s.active !== false ? 'text-bg-success' : 'text-bg-secondary'
                        }`}
                      >
                        {s.active !== false ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          title="Editar"
                          onClick={() => openEdit(s)}
                        >
                          <Icon name="edit" size={14} />
                        </button>
                        <button
                          type="button"
                          className={`btn ${
                            s.active !== false ? 'btn-outline-warning' : 'btn-outline-success'
                          }`}
                          title={s.active !== false ? 'Desativar' : 'Reativar'}
                          onClick={() => toggleActive(s)}
                        >
                          <Icon name={s.active !== false ? 'x' : 'check'} size={14} />
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
          title={editing ? `Editar fornecedor #${editing.id}` : 'Novo fornecedor'}
          icon="user-check"
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
                form="supplier-form"
                className="btn btn-primary"
                disabled={saving || !form.name.trim()}
              >
                {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar'}
              </button>
            </>
          }
        >
          <form id="supplier-form" onSubmit={submit}>
            {error && (
              <div className="alert alert-danger py-2 small" role="alert">
                {error}
              </div>
            )}
            <h6 className="text-muted text-uppercase small fw-semibold mb-3">Dados do fornecedor</h6>
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label htmlFor="s-name" className="form-label">
                  Nome fantasia *
                </label>
                <input
                  id="s-name"
                  type="text"
                  className="form-control"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  autoFocus
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="s-legal" className="form-label">
                  Razão social
                </label>
                <input
                  id="s-legal"
                  type="text"
                  className="form-control"
                  value={form.legalName}
                  onChange={(e) => setForm((f) => ({ ...f, legalName: e.target.value }))}
                />
              </div>
              <div className="col-md-4">
                <label htmlFor="s-cnpj" className="form-label">
                  CNPJ
                </label>
                <input
                  id="s-cnpj"
                  type="text"
                  inputMode="numeric"
                  className="form-control"
                  placeholder="Somente números"
                  maxLength="18"
                  value={form.cnpj}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, cnpj: digitsOnly(e.target.value).slice(0, 14) }))
                  }
                />
              </div>
              <div className="col-md-4">
                <label htmlFor="s-contact" className="form-label">
                  Contato
                </label>
                <input
                  id="s-contact"
                  type="text"
                  className="form-control"
                  value={form.contactName}
                  onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                />
              </div>
              <div className="col-md-4">
                <label htmlFor="s-phone" className="form-label">
                  Telefone
                </label>
                <input
                  id="s-phone"
                  type="tel"
                  className="form-control"
                  placeholder="(00) 00000-0000"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="col-md-12">
                <label htmlFor="s-email" className="form-label">
                  E-mail
                </label>
                <input
                  id="s-email"
                  type="email"
                  className="form-control"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>

            <h6 className="text-muted text-uppercase small fw-semibold mb-3">Endereço</h6>
            <div className="row g-3 mb-3">
              <div className="col-md-3">
                <label htmlFor="s-zip" className="form-label">
                  CEP
                </label>
                <input
                  id="s-zip"
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
                <label htmlFor="s-street" className="form-label">
                  Logradouro
                </label>
                <input
                  id="s-street"
                  type="text"
                  className="form-control"
                  value={form.street}
                  onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
                />
              </div>
              <div className="col-md-2">
                <label htmlFor="s-number" className="form-label">
                  Número
                </label>
                <input
                  id="s-number"
                  type="text"
                  className="form-control"
                  value={form.number}
                  onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
                />
              </div>
              <div className="col-md-4">
                <label htmlFor="s-complement" className="form-label">
                  Complemento
                </label>
                <input
                  id="s-complement"
                  type="text"
                  className="form-control"
                  value={form.complement}
                  onChange={(e) => setForm((f) => ({ ...f, complement: e.target.value }))}
                />
              </div>
              <div className="col-md-4">
                <label htmlFor="s-district" className="form-label">
                  Bairro
                </label>
                <input
                  id="s-district"
                  type="text"
                  className="form-control"
                  value={form.district}
                  onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
                />
              </div>
              <div className="col-md-3">
                <label htmlFor="s-city" className="form-label">
                  Cidade
                </label>
                <input
                  id="s-city"
                  type="text"
                  className="form-control"
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                />
              </div>
              <div className="col-md-1">
                <label htmlFor="s-state" className="form-label">
                  UF
                </label>
                <input
                  id="s-state"
                  type="text"
                  className="form-control text-uppercase"
                  maxLength="2"
                  value={form.state}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                />
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="s-notes" className="form-label">
                Observações
              </label>
              <textarea
                id="s-notes"
                className="form-control"
                rows="2"
                maxLength="1000"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>

            <div className="form-check form-switch">
              <input
                id="s-active"
                type="checkbox"
                className="form-check-input"
                role="switch"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              />
              <label htmlFor="s-active" className="form-check-label">
                Fornecedor ativo
              </label>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
