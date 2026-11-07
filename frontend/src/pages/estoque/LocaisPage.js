import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { buildEstoqueMock } from '../../mocks/estoqueMock';
import Icon from '../../components/Icons/Icons';
import Modal from '../../components/Modal/Modal';
import styles from '../../styles/bsTheme.module.css';

const ENDPOINT = '/storage-locations';

const EMPTY_FORM = { name: '', description: '', active: true };

export default function LocaisPage() {
  const [locations, setLocations] = useState(null);
  const [balances, setBalances] = useState([]);
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
    const mock = buildEstoqueMock();
    const [locationsRes, balancesRes] = await Promise.allSettled([
      api.get(ENDPOINT),
      api.get('/stock-balances'),
    ]);
    const list =
      locationsRes.status === 'fulfilled' && Array.isArray(locationsRes.value)
        ? locationsRes.value
        : mock.storageLocations;
    setLocations(list);
    setBalances(
      balancesRes.status === 'fulfilled' && Array.isArray(balancesRes.value)
        ? balancesRes.value
        : mock.stockBalances
    );
    setMocked(locationsRes.status !== 'fulfilled');
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const usageCount = useMemo(() => {
    const map = new Map();
    for (const b of balances) {
      map.set(String(b.locationId), (map.get(String(b.locationId)) ?? 0) + 1);
    }
    return map;
  }, [balances]);

  const filtered = useMemo(() => {
    const list = [...(locations ?? [])].sort((a, b) =>
      (a.name ?? '').localeCompare(b.name ?? '', 'pt-BR')
    );
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter(
      (l) =>
        (l.name ?? '').toLowerCase().includes(term) ||
        (l.description ?? '').toLowerCase().includes(term)
    );
  }, [locations, search]);

  const stats = useMemo(() => {
    const list = locations ?? [];
    const active = list.filter((l) => l.active !== false).length;
    return { total: list.length, active, inactive: list.length - active };
  }, [locations]);

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(location) {
    setEditing(location);
    setForm({
      name: location.name ?? '',
      description: location.description ?? '',
      active: location.active !== false,
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
        setError(err?.message ?? 'Erro ao salvar local.');
      } else {
        setLocations((prev) => {
          if (editing) {
            return prev.map((l) => (l.id === editing.id ? { ...l, ...payload } : l));
          }
          const id = Math.max(0, ...prev.map((l) => Number(l.id) || 0)) + 1;
          return [...prev, { id, createdAt: new Date().toISOString(), ...payload }];
        });
      }
    } finally {
      setSaving(false);
      if (!failed) closeModal();
    }
  }

  async function toggleActive(location) {
    const next = !(location.active !== false);
    const payload = { name: location.name, description: location.description, active: next };
    try {
      await api.put(`${ENDPOINT}/${location.id}`, payload);
      await load();
    } catch {
      setMocked(true);
      setLocations((prev) => prev.map((l) => (l.id === location.id ? { ...l, active: next } : l)));
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setSaving(true);
    setDeleteError(null);
    try {
      await api.delete(`${ENDPOINT}/${deleting.id}`);
      await load();
      setDeleting(null);
    } catch {
      if (!mocked) {
        setDeleteError(
          'Não foi possível excluir — o local pode estar vinculado a saldos, lotes ou movimentações.'
        );
      } else {
        setLocations((prev) => prev.filter((l) => l.id !== deleting.id));
        setDeleting(null);
      }
    } finally {
      setSaving(false);
    }
  }

  if (!locations) {
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
          <h1 className="h4 mb-1 fw-semibold">Locais de armazenamento</h1>
          <p className="mb-0 text-muted small">Depósitos, câmaras e pontos de estoque</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openNew}>
          <Icon name="plus" size={16} className="me-1" />
          Novo local
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
              <div className="fs-5 fw-semibold">{stats.total} locais</div>
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
          <div className="input-group input-group-sm" style={{ maxWidth: 340 }}>
            <span className="input-group-text">
              <Icon name="search" size={14} />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar local..."
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
                <th>Nome</th>
                <th>Descrição</th>
                <th>Saldos vinculados</th>
                <th>Status</th>
                <th className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">
                    {search ? 'Nenhum local encontrado.' : 'Nenhum local cadastrado.'}
                  </td>
                </tr>
              ) : (
                filtered.map((l) => (
                  <tr key={l.id}>
                    <td className="fw-semibold">#{l.id}</td>
                    <td className="fw-medium">{l.name}</td>
                    <td className="text-muted">{l.description || '—'}</td>
                    <td>{usageCount.get(String(l.id)) ?? 0}</td>
                    <td>
                      <span
                        className={`badge ${
                          l.active !== false ? 'text-bg-success' : 'text-bg-secondary'
                        }`}
                      >
                        {l.active !== false ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          title="Editar"
                          onClick={() => openEdit(l)}
                        >
                          <Icon name="edit" size={14} />
                        </button>
                        <button
                          type="button"
                          className={`btn ${
                            l.active !== false ? 'btn-outline-warning' : 'btn-outline-success'
                          }`}
                          title={l.active !== false ? 'Desativar' : 'Reativar'}
                          onClick={() => toggleActive(l)}
                        >
                          <Icon name={l.active !== false ? 'x' : 'check'} size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          title="Excluir"
                          onClick={() => {
                            setDeleteError(null);
                            setDeleting(l);
                          }}
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

      {modalOpen && (
        <Modal
          title={editing ? `Editar local #${editing.id}` : 'Novo local'}
          icon="archive"
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
                form="location-form"
                className="btn btn-primary"
                disabled={saving || !form.name.trim()}
              >
                {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar'}
              </button>
            </>
          }
        >
          <form id="location-form" onSubmit={submit}>
            {error && (
              <div className="alert alert-danger py-2 small" role="alert">
                {error}
              </div>
            )}
            <div className="mb-3">
              <label htmlFor="loc-name" className="form-label">
                Nome *
              </label>
              <input
                id="loc-name"
                type="text"
                className="form-control"
                placeholder="Ex.: Depósito central"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                autoFocus
              />
            </div>
            <div className="mb-3">
              <label htmlFor="loc-description" className="form-label">
                Descrição
              </label>
              <textarea
                id="loc-description"
                className="form-control"
                rows="2"
                maxLength="1000"
                placeholder="Ex.: Almoxarifado de insumos"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="form-check form-switch">
              <input
                id="loc-active"
                type="checkbox"
                className="form-check-input"
                role="switch"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              />
              <label htmlFor="loc-active" className="form-check-label">
                Local ativo
              </label>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <Modal
          title="Excluir local"
          icon="trash"
          onClose={() => !saving && setDeleting(null)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setDeleting(null)}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmDelete}
                disabled={saving}
              >
                {saving ? 'Excluindo...' : 'Excluir'}
              </button>
            </>
          }
        >
          {deleteError && (
            <div className="alert alert-danger py-2 small" role="alert">
              {deleteError}
            </div>
          )}
          <p className="mb-0">
            Excluir o local <strong>{deleting.name}</strong>?
            {(usageCount.get(String(deleting.id)) ?? 0) > 0 && (
              <>
                {' '}
                Existem <strong>{usageCount.get(String(deleting.id))}</strong> saldo(s)
                vinculado(s) a ele.
              </>
            )}{' '}
            Esta ação não pode ser desfeita.
          </p>
        </Modal>
      )}
    </div>
  );
}
