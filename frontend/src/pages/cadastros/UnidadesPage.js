import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { buildCadastrosMock } from '../../mocks/cadastrosMock';
import Icon from '../../components/Icons/Icons';
import Modal from '../../components/Modal/Modal';
import styles from '../../styles/bsTheme.module.css';

const ENDPOINT = '/measurement-units';

const EMPTY_FORM = {
  name: '',
  abbreviation: '',
  active: true,
};

export default function UnidadesPage() {
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
      measurementUnits: ENDPOINT,
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

  const usageByAbbreviation = useMemo(() => {
    const map = {};
    (data?.products ?? []).forEach((p) => {
      if (p.unit) map[p.unit] = (map[p.unit] ?? 0) + 1;
    });
    return map;
  }, [data]);

  const rows = useMemo(() => {
    let list = [...(data?.measurementUnits ?? [])].sort((a, b) =>
      String(a.name).localeCompare(String(b.name), 'pt-BR')
    );
    if (statusFilter === 'active') list = list.filter((u) => u.active !== false);
    if (statusFilter === 'inactive') list = list.filter((u) => u.active === false);
    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (u) =>
          (u.name ?? '').toLowerCase().includes(term) ||
          (u.abbreviation ?? '').toLowerCase().includes(term) ||
          String(u.id).includes(term)
      );
    }
    return list;
  }, [data, search, statusFilter]);

  const stats = useMemo(() => {
    const list = data?.measurementUnits ?? [];
    const active = list.filter((u) => u.active !== false);
    return {
      total: list.length,
      active: active.length,
      inactive: list.length - active.length,
      inUse: list.filter((u) => (usageByAbbreviation[u.abbreviation] ?? 0) > 0).length,
    };
  }, [data, usageByAbbreviation]);

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(u) {
    setEditing(u);
    setForm({
      name: u.name ?? '',
      abbreviation: u.abbreviation ?? '',
      active: u.active !== false,
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

  const formValid = form.name.trim() !== '' && form.abbreviation.trim() !== '';

  async function submit(e) {
    e.preventDefault();
    if (!formValid) return;
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      abbreviation: form.abbreviation.trim(),
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
            ? 'Já existe uma unidade com este nome ou sigla.'
            : err?.message ?? 'Erro ao salvar unidade.'
        );
      } else {
        const duplicate = data.measurementUnits.some(
          (u) =>
            u.id !== editing?.id &&
            (String(u.name).toLowerCase() === payload.name.toLowerCase() ||
              String(u.abbreviation).toLowerCase() === payload.abbreviation.toLowerCase())
        );
        if (duplicate) {
          failed = true;
          setError('Já existe uma unidade com este nome ou sigla.');
        } else {
          setData((prev) => {
            if (editing) {
              return {
                ...prev,
                measurementUnits: prev.measurementUnits.map((u) =>
                  u.id === editing.id ? { ...u, ...payload } : u
                ),
              };
            }
            const id =
              Math.max(0, ...prev.measurementUnits.map((u) => Number(u.id) || 0)) + 1;
            return {
              ...prev,
              measurementUnits: [
                { id, createdAt: new Date().toISOString(), ...payload },
                ...prev.measurementUnits,
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
          measurementUnits: prev.measurementUnits.filter((u) => u.id !== deleting.id),
        }));
      } else {
        failed = true;
        setDeleteError(err?.message ?? 'Erro ao excluir unidade.');
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

  const deletingUsage = deleting ? usageByAbbreviation[deleting.abbreviation] ?? 0 : 0;

  return (
    <div className={styles.bs}>
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <div>
          <h1 className="h4 mb-1 fw-semibold">Unidades de medida</h1>
          <p className="mb-0 text-muted small">Unidades usadas em produtos, estoque e receitas</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openNew}>
          <Icon name="plus" size={16} className="me-1" />
          Nova unidade
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
              <span className="text-muted small text-uppercase">Unidades</span>
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
              placeholder="Buscar unidade ou sigla..."
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
                <th>Sigla</th>
                <th className="text-end">Produtos</th>
                <th>Status</th>
                <th className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">
                    Nenhuma unidade encontrada.
                  </td>
                </tr>
              ) : (
                rows.map((u) => {
                  const usage = usageByAbbreviation[u.abbreviation] ?? 0;
                  return (
                    <tr key={u.id}>
                      <td className="fw-semibold">#{u.id}</td>
                      <td className="fw-medium">{u.name}</td>
                      <td>
                        <span className="badge text-bg-light border">{u.abbreviation}</span>
                      </td>
                      <td className="text-end">
                        {usage > 0 ? (
                          <span className="badge text-bg-light border">{usage}</span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        {u.active !== false ? (
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <Modal
          title={editing ? `Editar unidade #${editing.id}` : 'Nova unidade de medida'}
          icon="sliders"
          onClose={closeModal}
          footer={
            <>
              <button type="button" className="btn btn-outline-secondary" onClick={closeModal} disabled={saving}>
                Cancelar
              </button>
              <button type="submit" form="unit-form" className="btn btn-primary" disabled={saving || !formValid}>
                {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar'}
              </button>
            </>
          }
        >
          <form id="unit-form" onSubmit={submit}>
            {error && (
              <div className="alert alert-danger py-2 small" role="alert">{error}</div>
            )}
            <div className="row g-3 mb-3">
              <div className="col-md-8">
                <label htmlFor="u-name" className="form-label">Nome *</label>
                <input
                  id="u-name"
                  type="text"
                  className="form-control"
                  maxLength="255"
                  placeholder="Ex.: Quilograma"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  autoFocus
                />
              </div>
              <div className="col-md-4">
                <label htmlFor="u-abbr" className="form-label">Sigla *</label>
                <input
                  id="u-abbr"
                  type="text"
                  className="form-control"
                  maxLength="10"
                  placeholder="Ex.: kg"
                  value={form.abbreviation}
                  onChange={(e) => setForm((f) => ({ ...f, abbreviation: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="form-check form-switch">
              <input
                id="u-active"
                type="checkbox"
                className="form-check-input"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              />
              <label htmlFor="u-active" className="form-check-label">Unidade ativa</label>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <Modal
          title="Excluir unidade"
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
              {deletingUsage} {deletingUsage === 1 ? 'produto usa' : 'produtos usam'} esta unidade.
              A unidade será removida da listagem, mas os produtos manterão a sigla.
            </div>
          )}
          <p className="mb-0">
            Excluir a unidade <strong>{deleting.name}</strong> ({deleting.abbreviation})?
            Esta ação não pode ser desfeita.
          </p>
        </Modal>
      )}
    </div>
  );
}
