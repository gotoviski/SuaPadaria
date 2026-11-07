import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { buildCadastrosMock } from '../../mocks/cadastrosMock';
import Icon from '../../components/Icons/Icons';
import Modal from '../../components/Modal/Modal';
import styles from '../../styles/bsTheme.module.css';

const ENDPOINT = '/products';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const parseAmount = (value) => Number(String(value).replace(',', '.')) || 0;

const EMPTY_FORM = {
  name: '',
  sku: '',
  category: '',
  unit: '',
  price: '',
  description: '',
  notes: '',
  active: true,
};

export default function ProdutosPage() {
  const [data, setData] = useState(null);
  const [mocked, setMocked] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
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
      products: ENDPOINT,
      productCategories: '/product-categories',
      measurementUnits: '/measurement-units',
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

  const categoryOptions = useMemo(() => {
    const names = new Set(
      (data?.productCategories ?? [])
        .filter((c) => c.active !== false)
        .map((c) => c.name)
    );
    (data?.products ?? []).forEach((p) => p.category && names.add(p.category));
    return [...names].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [data]);

  const rows = useMemo(() => {
    let list = [...(data?.products ?? [])].sort((a, b) =>
      String(a.name).localeCompare(String(b.name), 'pt-BR')
    );
    if (categoryFilter) list = list.filter((p) => p.category === categoryFilter);
    if (statusFilter === 'active') list = list.filter((p) => p.active !== false);
    if (statusFilter === 'inactive') list = list.filter((p) => p.active === false);
    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (p) =>
          (p.name ?? '').toLowerCase().includes(term) ||
          (p.sku ?? '').toLowerCase().includes(term) ||
          (p.category ?? '').toLowerCase().includes(term) ||
          (p.description ?? '').toLowerCase().includes(term) ||
          String(p.id).includes(term)
      );
    }
    return list;
  }, [data, search, categoryFilter, statusFilter]);

  const stats = useMemo(() => {
    const list = data?.products ?? [];
    const active = list.filter((p) => p.active !== false);
    return {
      total: list.length,
      active: active.length,
      inactive: list.length - active.length,
      categories: new Set(list.map((p) => p.category).filter(Boolean)).size,
    };
  }, [data]);

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
      sku: p.sku ?? '',
      category: p.category ?? '',
      unit: p.unit ?? '',
      price: p.price != null ? String(p.price).replace('.', ',') : '',
      description: p.description ?? '',
      notes: p.notes ?? '',
      active: p.active !== false,
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

  const formValid = form.name.trim() !== '' && (form.price === '' || parseAmount(form.price) >= 0);

  async function submit(e) {
    e.preventDefault();
    if (!formValid) return;
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      category: form.category.trim() || null,
      unit: form.unit.trim() || null,
      price: form.price === '' ? null : parseAmount(form.price),
      sku: form.sku.trim() || null,
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
        setError(err?.message ?? 'Erro ao salvar produto.');
      } else {
        setData((prev) => {
          if (editing) {
            return {
              ...prev,
              products: prev.products.map((p) => (p.id === editing.id ? { ...p, ...payload } : p)),
            };
          }
          const id = Math.max(0, ...prev.products.map((p) => Number(p.id) || 0)) + 1;
          return {
            ...prev,
            products: [{ id, createdAt: new Date().toISOString(), ...payload }, ...prev.products],
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
    setDeleteError(null);
    let failed = false;
    try {
      await api.delete(`${ENDPOINT}/${deleting.id}`);
      await load();
    } catch (err) {
      if (mocked) {
        setData((prev) => ({
          ...prev,
          products: prev.products.filter((p) => p.id !== deleting.id),
        }));
      } else {
        failed = true;
        setDeleteError(
          err?.status === 409
            ? 'Este produto possui vínculos (estoque, vendas ou receitas) e não pode ser excluído. Desative-o para deixar de usá-lo.'
            : err?.message ?? 'Erro ao excluir produto.'
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
          <h1 className="h4 mb-1 fw-semibold">Produtos</h1>
          <p className="mb-0 text-muted small">Catálogo de produtos e insumos</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openNew}>
          <Icon name="plus" size={16} className="me-1" />
          Novo produto
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
              <span className="text-muted small text-uppercase">Produtos</span>
              <div className="fs-5 fw-semibold">{stats.total}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Ativos</span>
              <div className="fs-5 fw-semibold text-success">{stats.active}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Inativos</span>
              <div className="fs-5 fw-semibold text-secondary">{stats.inactive}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Categorias</span>
              <div className="fs-5 fw-semibold">{stats.categories}</div>
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
              placeholder="Buscar nome, SKU ou categoria..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-select form-select-sm"
            style={{ maxWidth: 180 }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Todas as categorias</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            className="form-select form-select-sm"
            style={{ maxWidth: 140 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Nº</th>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Unidade</th>
                <th className="text-end">Preço</th>
                <th>Status</th>
                <th className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-4">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              ) : (
                rows.map((p) => (
                  <tr key={p.id}>
                    <td className="fw-semibold">#{p.id}</td>
                    <td>
                      <div className="fw-medium">{p.name}</div>
                      {p.sku && <div className="text-muted small">SKU: {p.sku}</div>}
                    </td>
                    <td>
                      {p.category ? (
                        <span className="badge text-bg-light border">{p.category}</span>
                      ) : '—'}
                    </td>
                    <td>{p.unit || '—'}</td>
                    <td className="text-end fw-semibold">
                      {p.price != null ? currency.format(Number(p.price) || 0) : '—'}
                    </td>
                    <td>
                      {p.active !== false ? (
                        <span className="badge text-bg-success">Ativo</span>
                      ) : (
                        <span className="badge text-bg-secondary">Inativo</span>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <Modal
          title={editing ? `Editar produto #${editing.id}` : 'Novo produto'}
          icon="bag"
          onClose={closeModal}
          footer={
            <>
              <button type="button" className="btn btn-outline-secondary" onClick={closeModal} disabled={saving}>
                Cancelar
              </button>
              <button type="submit" form="product-form" className="btn btn-primary" disabled={saving || !formValid}>
                {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar'}
              </button>
            </>
          }
        >
          <form id="product-form" onSubmit={submit}>
            {error && (
              <div className="alert alert-danger py-2 small" role="alert">{error}</div>
            )}
            <div className="row g-3 mb-3">
              <div className="col-md-8">
                <label htmlFor="p-name" className="form-label">Nome *</label>
                <input
                  id="p-name"
                  type="text"
                  className="form-control"
                  maxLength="255"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  autoFocus
                />
              </div>
              <div className="col-md-4">
                <label htmlFor="p-sku" className="form-label">SKU</label>
                <input
                  id="p-sku"
                  type="text"
                  className="form-control"
                  maxLength="60"
                  placeholder="Ex.: PAO-FRA"
                  value={form.sku}
                  onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                />
              </div>
              <div className="col-md-4">
                <label htmlFor="p-category" className="form-label">Categoria</label>
                <input
                  id="p-category"
                  type="text"
                  className="form-control"
                  maxLength="100"
                  list="category-options"
                  placeholder="Ex.: Pães"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                />
                <datalist id="category-options">
                  {categoryOptions.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div className="col-md-4">
                <label htmlFor="p-unit" className="form-label">Unidade</label>
                <input
                  id="p-unit"
                  type="text"
                  className="form-control"
                  maxLength="10"
                  list="unit-options"
                  placeholder="Ex.: un"
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                />
                <datalist id="unit-options">
                  {data.measurementUnits
                    .filter((u) => u.active !== false)
                    .map((u) => (
                      <option key={u.id} value={u.abbreviation} label={u.name} />
                    ))}
                </datalist>
              </div>
              <div className="col-md-4">
                <label htmlFor="p-price" className="form-label">Preço de venda</label>
                <div className="input-group">
                  <span className="input-group-text">R$</span>
                  <input
                    id="p-price"
                    type="text"
                    inputMode="decimal"
                    className="form-control"
                    placeholder="0,00"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="mb-3">
              <label htmlFor="p-description" className="form-label">Descrição</label>
              <textarea
                id="p-description"
                className="form-control"
                rows="2"
                maxLength="1000"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="p-notes" className="form-label">Observações</label>
              <textarea
                id="p-notes"
                className="form-control"
                rows="2"
                maxLength="1000"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div className="form-check form-switch">
              <input
                id="p-active"
                type="checkbox"
                className="form-check-input"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              />
              <label htmlFor="p-active" className="form-check-label">Produto ativo</label>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <Modal
          title="Excluir produto"
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
            Excluir o produto <strong>{deleting.name}</strong>
            {deleting.sku ? ` (${deleting.sku})` : ''}?
            Esta ação não pode ser desfeita.
          </p>
        </Modal>
      )}
    </div>
  );
}
