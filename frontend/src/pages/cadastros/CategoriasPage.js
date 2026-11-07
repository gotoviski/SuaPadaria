import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { buildCadastrosMock } from '../../mocks/cadastrosMock';
import Icon from '../../components/Icons/Icons';
import Modal from '../../components/Modal/Modal';
import styles from '../../styles/bsTheme.module.css';

const ENDPOINT = '/product-categories';

const EMPTY_FORM = {
  name: '',
  description: '',
  active: true,
};

export default function CategoriasPage() {
  const [data, setData] = useState(null);
  const [mocked, setMocked] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const load = useCallback(async () => {
    const mock = buildCadastrosMock();
    const endpoints = {
      productCategories: ENDPOINT,
      products: '/products',
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

  const usageByName = useMemo(() => {
    const map = {};
    (data?.products ?? []).forEach((p) => {
      if (p.category) map[p.category] = (map[p.category] ?? 0) + 1;
    });
    return map;
  }, [data]);

  const rows = useMemo(() => {
    let list = [...(data?.productCategories ?? [])].sort((a, b) =>
      String(a.name).localeCompare(String(b.name), 'pt-BR')
    );
    if (statusFilter === 'active') list = list.filter((c) => c.active !== false);
    if (statusFilter === 'inactive') list = list.filter((c) => c.active === false);
    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (c) =>
          (c.name ?? '').toLowerCase().includes(term) ||
          (c.description ?? '').toLowerCase().includes(term) ||
          String(c.id).includes(term)
      );
    }
    return list;
  }, [data, search, statusFilter]);

  const stats = useMemo(() => {
    const list = data?.productCategories ?? [];
    const active = list.filter((c) => c.active !== false);
    return {
      total: list.length,
      active: active.length,
      inactive: list.length - active.length,
      inUse: list.filter((c) => (usageByName[c.name] ?? 0) > 0).length,
    };
  }, [data, usageByName]);

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(c) {
    setEditing(c);
    setForm({
      name: c.name ?? '',
      description: c.description ?? '',
      active: c.active !== false,
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
      description: form.description.trim() || null,
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
        setError(
          err?.status === 409
            ? 'Já existe uma categoria com este nome.'
            : err?.message ?? 'Erro ao salvar categoria.'
        );
      } else {
        const duplicate = data.productCategories.some(
          (c) =>
            c.id !== editing?.id &&
            String(c.name).toLowerCase() === payload.name.toLowerCase()
        );
        if (duplicate) {
          failed = true;
          setError('Já existe uma categoria com este nome.');
        } else {
          setData((prev) => {
            if (editing) {
              return {
                ...prev,
                productCategories: prev.productCategories.map((c) =>
                  c.id === editing.id ? { ...c, ...payload } : c
                ),
              };
            }
            const id =
              Math.max(0, ...prev.productCategories.map((c) => Number(c.id) || 0)) + 1;
            return {
              ...prev,
              productCategories: [
                { id, createdAt: new Date().toISOString(), ...payload },
                ...prev.productCategories,
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
          productCategories: prev.productCategories.filter((c) => c.id !== deleting.id),
        }));
      } else {
        failed = true;
        setDeleteError(err?.message ?? 'Erro ao excluir categoria.');
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

  const deletingUsage = deleting ? usageByName[deleting.name] ?? 0 : 0;

  return (
    <div className={styles.bs}>
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <div>
          <h1 className="h4 mb-1 fw-semibold">Categorias</h1>
          <p className="mb-0 text-muted small">Categorias de produtos</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openNew}>
          <Icon name="plus" size={16} className="me-1" />
          Nova categoria
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
              <span className="text-muted small text-uppercase">Categorias</span>
              <div className="fs-5 fw-semibold">{stats.total}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Ativas</span>
              <div className="fs-5 fw-semibold text-success">{stats.active}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Inativas</span>
              <div className="fs-5 fw-semibold text-secondary">{stats.inactive}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Em uso</span>
              <div className="fs-5 fw-semibold">{stats.inUse}</div>
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
              placeholder="Buscar categoria..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-select form-select-sm"
            style={{ maxWidth: 140 }}
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
                <th className="text-end">Produtos</th>
                <th>Status</th>
                <th className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-4">
                    Nenhuma categoria encontrada.
                  </td>
                </tr>
              ) : (
                rows.map((c) => {
                  const usage = usageByName[c.name] ?? 0;
                  return (
                    <tr key={c.id}>
                      <td className="fw-semibold">#{c.id}</td>
                      <td>
                        <div className="fw-medium">{c.name}</div>
                        {c.description && (
                          <div className="text-muted small text-truncate" style={{ maxWidth: 380 }}>
                            {c.description}
                          </div>
                        )}
                      </td>
                      <td className="text-end">
                        {usage > 0 ? (
                          <span className="badge text-bg-light border">{usage}</span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        {c.active !== false ? (
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
                            onClick={() => openEdit(c)}
                          >
                            <Icon name="edit" size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            title="Excluir"
                            onClick={() => { setDeleteError(null); setDeleting(c); }}
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
          title={editing ? `Editar categoria #${editing.id}` : 'Nova categoria'}
          icon="folder"
          onClose={closeModal}
          footer={
            <>
              <button type="button" className="btn btn-outline-secondary" onClick={closeModal} disabled={saving}>
                Cancelar
              </button>
              <button type="submit" form="category-form" className="btn btn-primary" disabled={saving || !formValid}>
                {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar'}
              </button>
            </>
          }
        >
          <form id="category-form" onSubmit={submit}>
            {error && (
              <div className="alert alert-danger py-2 small" role="alert">{error}</div>
            )}
            <div className="mb-3">
              <label htmlFor="c-name" className="form-label">Nome *</label>
              <input
                id="c-name"
                type="text"
                className="form-control"
                maxLength="255"
                placeholder="Ex.: Pães, Bebidas"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                autoFocus
              />
            </div>
            <div className="mb-3">
              <label htmlFor="c-description" className="form-label">Descrição</label>
              <textarea
                id="c-description"
                className="form-control"
                rows="2"
                maxLength="1000"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="form-check form-switch">
              <input
                id="c-active"
                type="checkbox"
                className="form-check-input"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              />
              <label htmlFor="c-active" className="form-check-label">Categoria ativa</label>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <Modal
          title="Excluir categoria"
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
              {deletingUsage} {deletingUsage === 1 ? 'produto usa' : 'produtos usam'} esta categoria.
              A categoria será removida da listagem, mas os produtos manterão o texto.
            </div>
          )}
          <p className="mb-0">
            Excluir a categoria <strong>{deleting.name}</strong>?
            Esta ação não pode ser desfeita.
          </p>
        </Modal>
      )}
    </div>
  );
}
