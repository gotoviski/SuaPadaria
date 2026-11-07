import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { buildAdministracaoMock } from '../../mocks/administracaoMock';
import Icon from '../../components/Icons/Icons';
import Modal from '../../components/Modal/Modal';
import styles from '../../styles/bsTheme.module.css';

const ENDPOINT = '/users';

const dateFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const fmtDate = (d) => (d ? dateFmt.format(new Date(d)) : '—');
const PHONE_RE = /^\+[1-9]\d{7,14}$/;

function normalizePhone(value) {
  const trimmed = value.trim();
  if (trimmed === '') return '';
  const digits = trimmed.replace(/\D/g, '');
  if (trimmed.startsWith('+')) return `+${digits}`;
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
  return `+${digits}`;
}

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  password: '',
  profileId: '',
};

export default function UsuariosPage() {
  const [data, setData] = useState(null);
  const [mocked, setMocked] = useState(false);
  const [search, setSearch] = useState('');
  const [profileFilter, setProfileFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const load = useCallback(async () => {
    const mock = buildAdministracaoMock();
    const endpoints = {
      users: ENDPOINT,
      accessProfiles: '/profiles',
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
    let list = [...(data?.users ?? [])].sort((a, b) =>
      String(a.name).localeCompare(String(b.name), 'pt-BR')
    );
    if (profileFilter === 'none') list = list.filter((u) => !u.profile);
    else if (profileFilter) list = list.filter((u) => String(u.profile?.id) === profileFilter);
    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (u) =>
          (u.name ?? '').toLowerCase().includes(term) ||
          (u.email ?? '').toLowerCase().includes(term) ||
          (u.phone ?? '').toLowerCase().includes(term) ||
          String(u.id).includes(term)
      );
    }
    return list;
  }, [data, search, profileFilter]);

  const stats = useMemo(() => {
    const list = data?.users ?? [];
    return {
      total: list.length,
      withProfile: list.filter((u) => u.profile).length,
      withoutProfile: list.filter((u) => !u.profile).length,
      profiles: (data?.accessProfiles ?? []).length,
    };
  }, [data]);

  function openEdit(u) {
    setEditing(u);
    setForm({
      name: u.name ?? '',
      email: u.email ?? '',
      phone: u.phone ?? '',
      password: '',
      profileId: u.profile ? String(u.profile.id) : '',
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

  const normalizedPhone = normalizePhone(form.phone);
  const formValid = useMemo(() => {
    if (form.name.trim() === '') return false;
    if (form.email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return false;
    if (form.phone !== '' && !PHONE_RE.test(normalizedPhone)) return false;
    if (form.password !== '' && form.password.length < 6) return false;
    return true;
  }, [form, normalizedPhone]);

  async function submit(e) {
    e.preventDefault();
    if (!formValid || !editing) return;
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: normalizedPhone || null,
      password: form.password || null,
    };
    const profileId = form.profileId ? Number(form.profileId) : null;
    const profileChanged = String(editing.profile?.id ?? '') !== form.profileId;
    let failed = false;
    try {
      await api.put(`${ENDPOINT}/${editing.id}`, payload);
      if (profileChanged) {
        await api.put(`${ENDPOINT}/${editing.id}/profile`, { profileId });
      }
      await load();
    } catch (err) {
      if (!mocked) {
        failed = true;
        setError(
          err?.status === 409
            ? 'Este e-mail já está cadastrado.'
            : err?.message ?? 'Erro ao salvar usuário.'
        );
      } else {
        const duplicate = data.users.some(
          (u) => u.id !== editing.id && payload.email && u.email === payload.email
        );
        if (duplicate) {
          failed = true;
          setError('Este e-mail já está cadastrado.');
        } else {
          const profile =
            data.accessProfiles.find((p) => String(p.id) === form.profileId) ?? null;
          setData((prev) => ({
            ...prev,
            users: prev.users.map((u) =>
              u.id === editing.id
                ? {
                    ...u,
                    name: payload.name,
                    email: payload.email ?? u.email,
                    phone: payload.phone ?? u.phone,
                    profile: profile ?? null,
                  }
                : u
            ),
          }));
        }
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
        setData((prev) => ({ ...prev, users: prev.users.filter((u) => u.id !== deleting.id) }));
      } else {
        failed = true;
        setDeleteError(err?.message ?? 'Erro ao excluir usuário.');
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
          <h1 className="h4 mb-1 fw-semibold">Usuários</h1>
          <p className="mb-0 text-muted small">Contas de acesso ao sistema</p>
        </div>
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
              <span className="text-muted small text-uppercase">Usuários</span>
              <div className="fs-5 fw-semibold">{stats.total}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Com perfil</span>
              <div className="fs-5 fw-semibold text-success">{stats.withProfile}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Sem perfil</span>
              <div className={`fs-5 fw-semibold ${stats.withoutProfile > 0 ? 'text-warning' : ''}`}>
                {stats.withoutProfile}
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Perfis</span>
              <div className="fs-5 fw-semibold">{stats.profiles}</div>
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
              placeholder="Buscar nome, e-mail ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-select form-select-sm"
            style={{ maxWidth: 180 }}
            value={profileFilter}
            onChange={(e) => setProfileFilter(e.target.value)}
          >
            <option value="">Todos os perfis</option>
            <option value="none">Sem perfil</option>
            {data.accessProfiles.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Nº</th>
                <th>Usuário</th>
                <th>Telefone</th>
                <th>Perfil</th>
                <th>Cadastro</th>
                <th className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                rows.map((u) => (
                  <tr key={u.id}>
                    <td className="fw-semibold">#{u.id}</td>
                    <td>
                      <div className="fw-medium">{u.name}</div>
                      <div className="text-muted small">{u.email || '—'}</div>
                    </td>
                    <td>{u.phone || '—'}</td>
                    <td>
                      {u.profile ? (
                        <span className="badge text-bg-primary">{u.profile.name}</span>
                      ) : (
                        <span className="badge text-bg-secondary">Sem perfil</span>
                      )}
                    </td>
                    <td className="text-nowrap text-muted">{fmtDate(u.createdAt)}</td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          title="Editar"
                          onClick={() => openEdit(u)}
                        >
                          <Icon name="edit" size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          title="Excluir"
                          onClick={() => { setDeleteError(null); setDeleting(u); }}
                        >
                          <Icon name="trash" size={14} />
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

      {modalOpen && editing && (
        <Modal
          title={`Editar usuário #${editing.id}`}
          icon="user"
          onClose={closeModal}
          footer={
            <>
              <button type="button" className="btn btn-outline-secondary" onClick={closeModal} disabled={saving}>
                Cancelar
              </button>
              <button type="submit" form="user-form" className="btn btn-primary" disabled={saving || !formValid}>
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </>
          }
        >
          <form id="user-form" onSubmit={submit}>
            {error && (
              <div className="alert alert-danger py-2 small" role="alert">{error}</div>
            )}
            <div className="mb-3">
              <label htmlFor="us-name" className="form-label">Nome *</label>
              <input
                id="us-name"
                type="text"
                className="form-control"
                maxLength="255"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                autoFocus
              />
            </div>
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label htmlFor="us-email" className="form-label">E-mail</label>
                <input
                  id="us-email"
                  type="email"
                  className="form-control"
                  maxLength="255"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="us-phone" className="form-label">Telefone</label>
                <input
                  id="us-phone"
                  type="text"
                  className="form-control"
                  maxLength="20"
                  placeholder="+5511999999999"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
                <div className="form-text">Formato internacional, ex.: +5511999999999</div>
              </div>
              <div className="col-md-6">
                <label htmlFor="us-password" className="form-label">Nova senha</label>
                <input
                  id="us-password"
                  type="password"
                  className="form-control"
                  maxLength="72"
                  minLength="6"
                  placeholder="Deixe em branco para manter"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                />
                {form.password !== '' && form.password.length < 6 && (
                  <div className="form-text text-danger">Senha deve ter no mínimo 6 caracteres.</div>
                )}
              </div>
              <div className="col-md-6">
                <label htmlFor="us-profile" className="form-label">Perfil de acesso</label>
                <select
                  id="us-profile"
                  className="form-select"
                  value={form.profileId}
                  onChange={(e) => setForm((f) => ({ ...f, profileId: e.target.value }))}
                >
                  <option value="">Sem perfil</option>
                  {data.accessProfiles.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <Modal
          title="Excluir usuário"
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
            Excluir o usuário <strong>{deleting.name}</strong>
            {deleting.email ? ` (${deleting.email})` : ''}?
            Esta ação não pode ser desfeita.
          </p>
        </Modal>
      )}
    </div>
  );
}
