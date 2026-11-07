import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { buildAdministracaoMock } from '../../mocks/administracaoMock';
import Icon from '../../components/Icons/Icons';
import Modal from '../../components/Modal/Modal';
import styles from '../../styles/bsTheme.module.css';

const ENDPOINT = '/profiles';

const PERMISSION_GROUPS = [
  { label: 'Empresa', perms: ['COMPANY_VIEW', 'COMPANY_MANAGE'] },
  { label: 'Usuários', perms: ['USERS_VIEW', 'USERS_MANAGE'] },
  { label: 'Perfis de acesso', perms: ['PROFILES_VIEW', 'PROFILES_MANAGE'] },
  { label: 'Produtos', perms: ['PRODUCTS_VIEW', 'PRODUCTS_MANAGE'] },
  { label: 'Tabelas de preço', perms: ['PRICE_TABLES_VIEW', 'PRICE_TABLES_MANAGE'] },
  { label: 'Clientes', perms: ['CUSTOMERS_VIEW', 'CUSTOMERS_MANAGE'] },
  { label: 'Pedidos', perms: ['ORDERS_VIEW', 'ORDERS_MANAGE'] },
  { label: 'Vendas', perms: ['SALES_VIEW', 'SALES_MANAGE'] },
  { label: 'Estoque', perms: ['STOCK_VIEW', 'STOCK_MANAGE'] },
  { label: 'Relatórios', perms: ['REPORTS_VIEW'] },
];

const permLabel = (p) =>
  p.endsWith('_VIEW') ? 'Visualizar' : p.endsWith('_MANAGE') ? 'Gerenciar' : p;

const permGroup = (p) =>
  PERMISSION_GROUPS.find((g) => g.perms.includes(p))?.label ?? p;

const EMPTY_FORM = {
  name: '',
  description: '',
  permissions: [],
};

export default function PerfisPage() {
  const [data, setData] = useState(null);
  const [mocked, setMocked] = useState(false);
  const [search, setSearch] = useState('');

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
      accessProfiles: ENDPOINT,
      permissions: `${ENDPOINT}/permissions`,
      users: '/users',
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

  const usageByProfile = useMemo(() => {
    const map = {};
    (data?.users ?? []).forEach((u) => {
      if (u.profile?.id) map[u.profile.id] = (map[u.profile.id] ?? 0) + 1;
    });
    return map;
  }, [data]);

  const groups = useMemo(() => {
    const available = new Set(data?.permissions ?? []);
    return PERMISSION_GROUPS.map((g) => ({
      ...g,
      perms: g.perms.filter((p) => available.size === 0 || available.has(p)),
    })).filter((g) => g.perms.length > 0);
  }, [data]);

  const rows = useMemo(() => {
    let list = [...(data?.accessProfiles ?? [])].sort((a, b) =>
      String(a.name).localeCompare(String(b.name), 'pt-BR')
    );
    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (p) =>
          (p.name ?? '').toLowerCase().includes(term) ||
          (p.description ?? '').toLowerCase().includes(term) ||
          String(p.id).includes(term)
      );
    }
    return list;
  }, [data, search]);

  const stats = useMemo(() => {
    const list = data?.accessProfiles ?? [];
    return {
      total: list.length,
      permissions: (data?.permissions ?? []).length,
      assigned: list.filter((p) => (usageByProfile[p.id] ?? 0) > 0).length,
      users: (data?.users ?? []).length,
    };
  }, [data, usageByProfile]);

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(p) {
    setEditing(p);
    setForm({
      name: p.name ?? '',
      description: p.description ?? '',
      permissions: [...(p.permissions ?? [])],
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

  function togglePermission(perm) {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(perm)
        ? f.permissions.filter((p) => p !== perm)
        : [...f.permissions, perm],
    }));
  }

  function toggleGroup(groupPerms) {
    setForm((f) => {
      const allSelected = groupPerms.every((p) => f.permissions.includes(p));
      return {
        ...f,
        permissions: allSelected
          ? f.permissions.filter((p) => !groupPerms.includes(p))
          : [...new Set([...f.permissions, ...groupPerms])],
      };
    });
  }

  const formValid = form.name.trim() !== '';

  async function submit(e) {
    e.preventDefault();
    if (!formValid) return;
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      permissions: form.permissions,
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
        setError(
          err?.status === 409
            ? 'Já existe um perfil com este nome.'
            : err?.message ?? 'Erro ao salvar perfil.'
        );
      } else {
        const duplicate = data.accessProfiles.some(
          (p) => p.id !== editing?.id && p.name === payload.name
        );
        if (duplicate) {
          failed = true;
          setError('Já existe um perfil com este nome.');
        } else {
          setData((prev) => {
            if (editing) {
              return {
                ...prev,
                accessProfiles: prev.accessProfiles.map((p) =>
                  p.id === editing.id ? { ...p, ...payload } : p
                ),
              };
            }
            const id =
              Math.max(0, ...prev.accessProfiles.map((p) => Number(p.id) || 0)) + 1;
            return {
              ...prev,
              accessProfiles: [
                { id, createdAt: new Date().toISOString(), ...payload },
                ...prev.accessProfiles,
              ],
            };
          });
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
        setData((prev) => ({
          ...prev,
          accessProfiles: prev.accessProfiles.filter((p) => p.id !== deleting.id),
        }));
      } else {
        failed = true;
        setDeleteError(
          err?.status === 409
            ? 'Este perfil está em uso por usuários e não pode ser excluído.'
            : err?.message ?? 'Erro ao excluir perfil.'
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

  const deletingUsage = deleting ? usageByProfile[deleting.id] ?? 0 : 0;

  return (
    <div className={styles.bs}>
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <div>
          <h1 className="h4 mb-1 fw-semibold">Perfis de acesso</h1>
          <p className="mb-0 text-muted small">Conjuntos de permissões atribuídos aos usuários</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openNew}>
          <Icon name="plus" size={16} className="me-1" />
          Novo perfil
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
              <span className="text-muted small text-uppercase">Perfis</span>
              <div className="fs-5 fw-semibold">{stats.total}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Em uso</span>
              <div className="fs-5 fw-semibold text-success">{stats.assigned}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Usuários</span>
              <div className="fs-5 fw-semibold">{stats.users}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Permissões</span>
              <div className="fs-5 fw-semibold">{stats.permissions}</div>
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
              placeholder="Buscar perfil..."
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
                <th>Perfil</th>
                <th>Permissões</th>
                <th className="text-end">Usuários</th>
                <th className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-4">
                    Nenhum perfil encontrado.
                  </td>
                </tr>
              ) : (
                rows.map((p) => {
                  const perms = [...(p.permissions ?? [])].sort((a, b) =>
                    `${permGroup(a)}${a}`.localeCompare(`${permGroup(b)}${b}`)
                  );
                  const usage = usageByProfile[p.id] ?? 0;
                  return (
                    <tr key={p.id}>
                      <td className="fw-semibold">#{p.id}</td>
                      <td>
                        <div className="fw-medium">{p.name}</div>
                        {p.description && (
                          <div className="text-muted small text-truncate" style={{ maxWidth: 320 }}>
                            {p.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="d-flex flex-wrap gap-1" style={{ maxWidth: 480 }}>
                          {perms.length === 0 ? (
                            <span className="text-muted">Nenhuma</span>
                          ) : (
                            perms.map((perm) => (
                              <span key={perm} className="badge text-bg-light border">
                                {permGroup(perm)} · {permLabel(perm)}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="text-end">
                        {usage > 0 ? (
                          <span className="badge text-bg-light border">{usage}</span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
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
                            onClick={() => { setDeleteError(null); setDeleting(p); }}
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
          title={editing ? `Editar perfil #${editing.id}` : 'Novo perfil de acesso'}
          icon="shield"
          wide
          onClose={closeModal}
          footer={
            <>
              <button type="button" className="btn btn-outline-secondary" onClick={closeModal} disabled={saving}>
                Cancelar
              </button>
              <button type="submit" form="profile-form" className="btn btn-primary" disabled={saving || !formValid}>
                {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar'}
              </button>
            </>
          }
        >
          <form id="profile-form" onSubmit={submit}>
            {error && (
              <div className="alert alert-danger py-2 small" role="alert">{error}</div>
            )}
            <div className="row g-3 mb-3">
              <div className="col-md-5">
                <label htmlFor="pf-name" className="form-label">Nome *</label>
                <input
                  id="pf-name"
                  type="text"
                  className="form-control"
                  maxLength="255"
                  placeholder="Ex.: Gerente"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  autoFocus
                />
              </div>
              <div className="col-md-7">
                <label htmlFor="pf-description" className="form-label">Descrição</label>
                <input
                  id="pf-description"
                  type="text"
                  className="form-control"
                  maxLength="255"
                  placeholder="Ex.: Gestão operacional da loja"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>
            <div className="mb-2 fw-semibold small text-uppercase text-muted">Permissões</div>
            <div className="row g-2">
              {groups.map((g) => (
                <div key={g.label} className="col-md-6">
                  <div className="border rounded p-2 h-100">
                    <div className="form-check mb-1">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id={`pf-group-${g.label}`}
                        checked={g.perms.every((p) => form.permissions.includes(p))}
                        onChange={() => toggleGroup(g.perms)}
                      />
                      <label className="form-check-label fw-semibold small" htmlFor={`pf-group-${g.label}`}>
                        {g.label}
                      </label>
                    </div>
                    <div className="d-flex flex-wrap gap-2 ms-4">
                      {g.perms.map((perm) => (
                        <div key={perm} className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id={`pf-perm-${perm}`}
                            checked={form.permissions.includes(perm)}
                            onChange={() => togglePermission(perm)}
                          />
                          <label className="form-check-label small" htmlFor={`pf-perm-${perm}`}>
                            {permLabel(perm)}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <Modal
          title="Excluir perfil"
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
          {deletingUsage > 0 && (
            <div className="alert alert-warning py-2 small" role="alert">
              Este perfil está atribuído a {deletingUsage}{' '}
              {deletingUsage === 1 ? 'usuário' : 'usuários'} — a exclusão pode ser recusada.
            </div>
          )}
          <p className="mb-0">
            Excluir o perfil <strong>{deleting.name}</strong>?
            Esta ação não pode ser desfeita.
          </p>
        </Modal>
      )}
    </div>
  );
}
