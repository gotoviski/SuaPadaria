import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { buildProducaoMock } from '../../mocks/producaoMock';
import Icon from '../../components/Icons/Icons';
import Modal from '../../components/Modal/Modal';
import styles from '../../styles/bsTheme.module.css';

const qtyFmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 });
const parseAmount = (value) => Number(String(value).replace(',', '.')) || 0;

const EMPTY_FORM = {
  productId: '',
  yieldQuantity: '',
  instructions: '',
  notes: '',
  active: true,
  ingredients: [],
};

export default function ReceitasPage() {
  const [data, setData] = useState(null);
  const [mocked, setMocked] = useState(false);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(() => new Set());

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const load = useCallback(async () => {
    const mock = buildProducaoMock();
    const [recipesRes, productsRes] = await Promise.allSettled([
      api.get('/recipes'),
      api.get('/products'),
    ]);
    const recipes =
      recipesRes.status === 'fulfilled' && Array.isArray(recipesRes.value)
        ? recipesRes.value
        : mock.recipes;
    const products =
      productsRes.status === 'fulfilled' && Array.isArray(productsRes.value)
        ? productsRes.value
        : mock.products;
    setMocked(recipesRes.status !== 'fulfilled' || productsRes.status !== 'fulfilled');
    setData({ recipes, products });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const unitOf = useCallback(
    (productId) =>
      (data?.products ?? []).find((p) => String(p.id) === String(productId))?.unit ?? '',
    [data]
  );

  const recipes = useMemo(() => {
    const list = [...(data?.recipes ?? [])].sort((a, b) =>
      (a.productName ?? '').localeCompare(b.productName ?? '', 'pt-BR')
    );
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter(
      (r) =>
        (r.productName ?? '').toLowerCase().includes(term) ||
        (r.ingredients ?? []).some((i) => (i.productName ?? '').toLowerCase().includes(term))
    );
  }, [data, search]);

  const stats = useMemo(() => {
    const list = data?.recipes ?? [];
    const active = list.filter((r) => r.active !== false).length;
    const ingredients = list.reduce((sum, r) => sum + (r.ingredients ?? []).length, 0);
    return { total: list.length, active, ingredients };
  }, [data]);

  function toggleExpand(id) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(recipe) {
    setEditing(recipe);
    setForm({
      productId: String(recipe.productId),
      yieldQuantity: String(recipe.yieldQuantity ?? '').replace('.', ','),
      instructions: recipe.instructions ?? '',
      notes: recipe.notes ?? '',
      active: recipe.active !== false,
      ingredients: (recipe.ingredients ?? []).map((i) => ({
        productId: String(i.productId),
        quantity: String(i.quantity ?? '').replace('.', ','),
      })),
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

  function setItem(index, patch) {
    setForm((f) => ({
      ...f,
      ingredients: f.ingredients.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  }

  const usedProductIds = useMemo(
    () => new Set(form.ingredients.map((i) => i.productId).filter(Boolean)),
    [form.ingredients]
  );

  const activeProducts = useMemo(
    () => (data?.products ?? []).filter((p) => p.active !== false),
    [data]
  );

  const formValid =
    form.productId !== '' &&
    parseAmount(form.yieldQuantity) > 0 &&
    form.ingredients.length > 0 &&
    form.ingredients.every((i) => i.productId !== '' && parseAmount(i.quantity) > 0);

  async function submit(e) {
    e.preventDefault();
    if (!formValid) return;
    setSaving(true);
    setError(null);
    const payload = {
      productId: Number(form.productId),
      yieldQuantity: parseAmount(form.yieldQuantity),
      instructions: form.instructions.trim() || null,
      notes: form.notes.trim() || null,
      active: form.active,
      ingredients: form.ingredients.map((i) => ({
        productId: Number(i.productId),
        quantity: parseAmount(i.quantity),
      })),
    };
    let failed = false;
    try {
      if (editing) {
        await api.put(`/recipes/${editing.id}`, payload);
      } else {
        await api.post('/recipes', payload);
      }
      await load();
    } catch (err) {
      if (!mocked) {
        failed = true;
        setError(err?.message ?? 'Erro ao salvar receita.');
      } else {
        const productName = (id) =>
          data.products.find((p) => String(p.id) === String(id))?.name ?? '';
        setData((prev) => {
          const ingredients = payload.ingredients.map((i, idx) => ({
            id: Date.now() + idx,
            productId: i.productId,
            productName: productName(i.productId),
            quantity: i.quantity,
          }));
          const patch = { ...payload, productName: productName(payload.productId), ingredients };
          if (editing) {
            return {
              ...prev,
              recipes: prev.recipes.map((r) => (r.id === editing.id ? { ...r, ...patch } : r)),
            };
          }
          const id = Math.max(0, ...prev.recipes.map((r) => Number(r.id) || 0)) + 1;
          return {
            ...prev,
            recipes: [
              ...prev.recipes,
              { id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...patch },
            ],
          };
        });
      }
    } finally {
      setSaving(false);
      if (!failed) closeModal();
    }
  }

  async function toggleActive(recipe) {
    const next = !(recipe.active !== false);
    const payload = {
      productId: recipe.productId,
      yieldQuantity: recipe.yieldQuantity,
      instructions: recipe.instructions,
      notes: recipe.notes,
      active: next,
      ingredients: (recipe.ingredients ?? []).map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
    };
    try {
      await api.put(`/recipes/${recipe.id}`, payload);
      await load();
    } catch {
      setMocked(true);
      setData((prev) => ({
        ...prev,
        recipes: prev.recipes.map((r) => (r.id === recipe.id ? { ...r, active: next } : r)),
      }));
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setSaving(true);
    setDeleteError(null);
    try {
      await api.delete(`/recipes/${deleting.id}`);
      await load();
      setDeleting(null);
    } catch {
      if (!mocked) {
        setDeleteError(
          'Não foi possível excluir — a receita pode estar vinculada a ordens de produção.'
        );
      } else {
        setData((prev) => ({
          ...prev,
          recipes: prev.recipes.filter((r) => r.id !== deleting.id),
        }));
        setDeleting(null);
      }
    } finally {
      setSaving(false);
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
          <h1 className="h4 mb-1 fw-semibold">Receitas</h1>
          <p className="mb-0 text-muted small">Fichas técnicas de produção</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openNew}>
          <Icon name="plus" size={16} className="me-1" />
          Nova receita
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
              <span className="text-muted small text-uppercase">Receitas</span>
              <div className="fs-5 fw-semibold">{stats.total}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-4">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Ativas</span>
              <div className="fs-5 fw-semibold text-success">{stats.active}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-4">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Ingredientes usados</span>
              <div className="fs-5 fw-semibold">{stats.ingredients}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="input-group input-group-sm" style={{ maxWidth: 360 }}>
            <span className="input-group-text">
              <Icon name="search" size={14} />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por produto ou ingrediente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th style={{ width: 40 }} />
                <th>Nº</th>
                <th>Produto</th>
                <th className="text-end">Rendimento</th>
                <th>Ingredientes</th>
                <th>Status</th>
                <th className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {recipes.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-4">
                    {search ? 'Nenhuma receita encontrada.' : 'Nenhuma receita cadastrada.'}
                  </td>
                </tr>
              ) : (
                recipes.map((r) => (
                  <RecipeRows
                    key={r.id}
                    recipe={r}
                    expanded={expanded.has(r.id)}
                    onToggle={() => toggleExpand(r.id)}
                    onEdit={() => openEdit(r)}
                    onToggleActive={() => toggleActive(r)}
                    onDelete={() => {
                      setDeleteError(null);
                      setDeleting(r);
                    }}
                    unitOf={unitOf}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <Modal
          title={editing ? `Editar receita #${editing.id}` : 'Nova receita'}
          icon="book"
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
                form="recipe-form"
                className="btn btn-primary"
                disabled={saving || !formValid}
              >
                {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar'}
              </button>
            </>
          }
        >
          <form id="recipe-form" onSubmit={submit}>
            {error && (
              <div className="alert alert-danger py-2 small" role="alert">
                {error}
              </div>
            )}
            <div className="row g-3 mb-3">
              <div className="col-md-8">
                <label htmlFor="r-product" className="form-label">
                  Produto final *
                </label>
                <select
                  id="r-product"
                  className="form-select"
                  value={form.productId}
                  onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}
                  required
                >
                  <option value="">Selecione...</option>
                  {activeProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label htmlFor="r-yield" className="form-label">
                  Rendimento *
                </label>
                <div className="input-group">
                  <input
                    id="r-yield"
                    type="text"
                    inputMode="decimal"
                    className="form-control"
                    placeholder="0"
                    value={form.yieldQuantity}
                    onChange={(e) => setForm((f) => ({ ...f, yieldQuantity: e.target.value }))}
                    required
                  />
                  {form.productId && unitOf(form.productId) && (
                    <span className="input-group-text">{unitOf(form.productId)}</span>
                  )}
                </div>
                <div className="form-text">Quantidade que a receita produz</div>
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-between mb-2">
              <h6 className="text-muted text-uppercase small fw-semibold mb-0">
                Ingredientes
              </h6>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    ingredients: [...f.ingredients, { productId: '', quantity: '' }],
                  }))
                }
              >
                <Icon name="plus" size={14} className="me-1" />
                Adicionar ingrediente
              </button>
            </div>

            {form.ingredients.length === 0 ? (
              <p className="text-muted small text-center border rounded py-3 mb-3">
                Nenhum ingrediente — clique em "Adicionar ingrediente".
              </p>
            ) : (
              <div className="table-responsive border rounded mb-3">
                <table className="table table-sm align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th style={{ width: 150 }}>Quantidade</th>
                      <th style={{ width: 48 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {form.ingredients.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={item.productId}
                            onChange={(e) => setItem(index, { productId: e.target.value })}
                            required
                          >
                            <option value="">Selecione...</option>
                            {activeProducts
                              .filter(
                                (p) =>
                                  String(p.id) === item.productId ||
                                  !usedProductIds.has(String(p.id))
                              )
                              .map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                          </select>
                        </td>
                        <td>
                          <div className="input-group input-group-sm">
                            <input
                              type="text"
                              inputMode="decimal"
                              className="form-control"
                              placeholder="0"
                              value={item.quantity}
                              onChange={(e) => setItem(index, { quantity: e.target.value })}
                              required
                            />
                            {item.productId && unitOf(item.productId) && (
                              <span className="input-group-text">{unitOf(item.productId)}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            title="Remover"
                            onClick={() =>
                              setForm((f) => ({
                                ...f,
                                ingredients: f.ingredients.filter((_, i) => i !== index),
                              }))
                            }
                          >
                            <Icon name="trash" size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mb-3">
              <label htmlFor="r-instructions" className="form-label">
                Modo de preparo
              </label>
              <textarea
                id="r-instructions"
                className="form-control"
                rows="3"
                maxLength="1000"
                value={form.instructions}
                onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="r-notes" className="form-label">
                Observações
              </label>
              <textarea
                id="r-notes"
                className="form-control"
                rows="2"
                maxLength="1000"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div className="form-check form-switch">
              <input
                id="r-active"
                type="checkbox"
                className="form-check-input"
                role="switch"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              />
              <label htmlFor="r-active" className="form-check-label">
                Receita ativa
              </label>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <Modal
          title="Excluir receita"
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
            Excluir a receita de <strong>{deleting.productName}</strong>? Esta ação não pode
            ser desfeita.
          </p>
        </Modal>
      )}
    </div>
  );
}

function RecipeRows({ recipe, expanded, onToggle, onEdit, onToggleActive, onDelete, unitOf }) {
  const ingredients = recipe.ingredients ?? [];
  return (
    <>
      <tr>
        <td>
          <button
            type="button"
            className="btn btn-sm btn-link text-muted p-0"
            onClick={onToggle}
            aria-label={expanded ? 'Recolher' : 'Expandir'}
            style={{
              transform: expanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 150ms ease',
            }}
          >
            <Icon name="chevron-down" size={16} />
          </button>
        </td>
        <td className="fw-semibold">#{recipe.id}</td>
        <td className="fw-medium">{recipe.productName}</td>
        <td className="text-end">
          {qtyFmt.format(Number(recipe.yieldQuantity) || 0)} {unitOf(recipe.productId)}
        </td>
        <td>{ingredients.length}</td>
        <td>
          <span
            className={`badge ${recipe.active !== false ? 'text-bg-success' : 'text-bg-secondary'}`}
          >
            {recipe.active !== false ? 'Ativa' : 'Inativa'}
          </span>
        </td>
        <td className="text-end">
          <div className="btn-group btn-group-sm">
            <button
              type="button"
              className="btn btn-outline-secondary"
              title="Editar"
              onClick={onEdit}
            >
              <Icon name="edit" size={14} />
            </button>
            <button
              type="button"
              className={`btn ${recipe.active !== false ? 'btn-outline-warning' : 'btn-outline-success'}`}
              title={recipe.active !== false ? 'Desativar' : 'Reativar'}
              onClick={onToggleActive}
            >
              <Icon name={recipe.active !== false ? 'x' : 'check'} size={14} />
            </button>
            <button
              type="button"
              className="btn btn-outline-danger"
              title="Excluir"
              onClick={onDelete}
            >
              <Icon name="trash" size={14} />
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan="7" className="p-0">
            <div className="px-4 py-2">
              <div className="row g-3">
                <div className="col-md-6">
                  <span className="text-muted small text-uppercase fw-semibold">
                    Ingredientes
                  </span>
                  {ingredients.length === 0 ? (
                    <p className="text-muted small mb-0 mt-1">Nenhum ingrediente.</p>
                  ) : (
                    <table className="table table-sm mb-0 mt-1">
                      <tbody>
                        {ingredients.map((i) => (
                          <tr key={i.id}>
                            <td className="border-0 ps-0">{i.productName}</td>
                            <td className="border-0 text-end">
                              {qtyFmt.format(Number(i.quantity) || 0)} {unitOf(i.productId)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                <div className="col-md-6">
                  {recipe.instructions && (
                    <>
                      <span className="text-muted small text-uppercase fw-semibold">
                        Modo de preparo
                      </span>
                      <p className="small mb-0 mt-1" style={{ whiteSpace: 'pre-line' }}>
                        {recipe.instructions}
                      </p>
                    </>
                  )}
                  {recipe.notes && (
                    <p className="small text-muted mb-0 mt-2">Obs.: {recipe.notes}</p>
                  )}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
