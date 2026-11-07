import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { buildProducaoMock } from '../../mocks/producaoMock';
import Icon from '../../components/Icons/Icons';
import Modal from '../../components/Modal/Modal';
import styles from '../../styles/bsTheme.module.css';

const STATUS_META = {
  OPEN: { label: 'Aberta', badge: 'text-bg-primary' },
  IN_PROGRESS: { label: 'Em andamento', badge: 'text-bg-warning' },
  COMPLETED: { label: 'Concluída', badge: 'text-bg-success' },
  CANCELLED: { label: 'Cancelada', badge: 'text-bg-secondary' },
};

const qtyFmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 });
const dateFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const parseAmount = (value) => Number(String(value).replace(',', '.')) || 0;

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

const EMPTY_FORM = {
  recipeId: '',
  plannedQuantity: '',
  scheduledDate: '',
  status: 'OPEN',
  notes: '',
  consumptions: [],
  results: [],
  startedAt: '',
  finishedAt: '',
};

export default function OrdensPage() {
  const [data, setData] = useState(null);
  const [mocked, setMocked] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expanded, setExpanded] = useState(() => new Set());

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const mock = buildProducaoMock();
    const endpoints = {
      productionOrders: '/production-orders',
      recipes: '/recipes',
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

  const unitOf = useCallback(
    (productId) =>
      (data?.products ?? []).find((p) => String(p.id) === String(productId))?.unit ?? '',
    [data]
  );

  const selectedRecipe = useMemo(
    () => (data?.recipes ?? []).find((r) => String(r.id) === form.recipeId) ?? null,
    [data, form.recipeId]
  );

  const orders = useMemo(() => {
    let list = [...(data?.productionOrders ?? [])].sort(
      (a, b) => new Date(b.scheduledDate ?? b.createdAt) - new Date(a.scheduledDate ?? a.createdAt)
    );
    if (statusFilter) list = list.filter((o) => o.status === statusFilter);
    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (o) =>
          (o.productName ?? '').toLowerCase().includes(term) ||
          String(o.id).includes(term)
      );
    }
    return list;
  }, [data, search, statusFilter]);

  const stats = useMemo(() => {
    const list = data?.productionOrders ?? [];
    return {
      total: list.length,
      open: list.filter((o) => o.status === 'OPEN').length,
      inProgress: list.filter((o) => o.status === 'IN_PROGRESS').length,
      completed: list.filter((o) => o.status === 'COMPLETED').length,
    };
  }, [data]);

  function toggleExpand(id) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function generateConsumptions(recipe, plannedQty) {
    if (!recipe || !plannedQty || plannedQty <= 0) return [];
    const factor = plannedQty / (Number(recipe.yieldQuantity) || 1);
    return (recipe.ingredients ?? []).map((ing) => ({
      productId: String(ing.productId),
      quantity: (Number(ing.quantity) * factor).toFixed(3).replace('.', ','),
    }));
  }

  function openNew() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, scheduledDate: nowLocalInput() });
    setError(null);
    setModalOpen(true);
  }

  function openEdit(order) {
    setEditing(order);
    setForm({
      recipeId: String(order.recipeId),
      plannedQuantity: String(order.plannedQuantity ?? '').replace('.', ','),
      scheduledDate: toLocalInput(order.scheduledDate),
      status: order.status ?? 'OPEN',
      notes: order.notes ?? '',
      consumptions: (order.consumptions ?? []).map((c) => ({
        productId: String(c.productId),
        quantity: String(c.quantity ?? '').replace('.', ','),
      })),
      results: (order.results ?? []).map((r) => ({
        productId: String(r.productId),
        quantity: String(r.quantity ?? '').replace('.', ','),
      })),
      startedAt: order.startedAt ?? '',
      finishedAt: order.finishedAt ?? '',
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

  function selectRecipe(recipeId) {
    const recipe = (data?.recipes ?? []).find((r) => String(r.id) === recipeId);
    setForm((f) => ({
      ...f,
      recipeId,
      consumptions: generateConsumptions(recipe, parseAmount(f.plannedQuantity)),
      results:
        f.results.length === 0 && recipe
          ? [{ productId: String(recipe.productId), quantity: f.plannedQuantity }]
          : f.results,
    }));
  }

  function changePlanned(value) {
    setForm((f) => ({
      ...f,
      plannedQuantity: value,
      consumptions: generateConsumptions(selectedRecipe, parseAmount(value)),
    }));
  }

  function listSetter(key) {
    return {
      set: (index, patch) =>
        setForm((f) => ({
          ...f,
          [key]: f[key].map((item, i) => (i === index ? { ...item, ...patch } : item)),
        })),
      add: () =>
        setForm((f) => ({ ...f, [key]: [...f[key], { productId: '', quantity: '' }] })),
      remove: (index) =>
        setForm((f) => ({ ...f, [key]: f[key].filter((_, i) => i !== index) })),
    };
  }

  const consumptions = listSetter('consumptions');
  const results = listSetter('results');

  const usedConsumptionIds = useMemo(
    () => new Set(form.consumptions.map((i) => i.productId).filter(Boolean)),
    [form.consumptions]
  );
  const usedResultIds = useMemo(
    () => new Set(form.results.map((i) => i.productId).filter(Boolean)),
    [form.results]
  );

  const activeProducts = useMemo(
    () => (data?.products ?? []).filter((p) => p.active !== false),
    [data]
  );

  const formValid =
    form.recipeId !== '' &&
    parseAmount(form.plannedQuantity) > 0 &&
    form.consumptions.every((i) => i.productId !== '' && parseAmount(i.quantity) > 0) &&
    form.results.every((i) => i.productId !== '' && parseAmount(i.quantity) > 0);

  async function submit(e) {
    e.preventDefault();
    if (!formValid) return;
    setSaving(true);
    setError(null);
    const nowIso = new Date().toISOString();
    const startedAt =
      form.status === 'IN_PROGRESS' || form.status === 'COMPLETED'
        ? form.startedAt || nowIso
        : null;
    const finishedAt = form.status === 'COMPLETED' ? form.finishedAt || nowIso : null;
    const payload = {
      recipeId: Number(form.recipeId),
      plannedQuantity: parseAmount(form.plannedQuantity),
      status: form.status,
      scheduledDate: form.scheduledDate ? new Date(form.scheduledDate).toISOString() : null,
      startedAt,
      finishedAt,
      notes: form.notes.trim() || null,
      consumptions: form.consumptions.map((i) => ({
        productId: Number(i.productId),
        quantity: parseAmount(i.quantity),
      })),
      results: form.results.map((i) => ({
        productId: Number(i.productId),
        quantity: parseAmount(i.quantity),
      })),
    };
    let failed = false;
    try {
      if (editing) {
        await api.put(`/production-orders/${editing.id}`, payload);
      } else {
        await api.post('/production-orders', payload);
      }
      await load();
    } catch (err) {
      if (!mocked) {
        failed = true;
        setError(err?.message ?? 'Erro ao salvar ordem de produção.');
      } else {
        const productName = (id) =>
          data.products.find((p) => String(p.id) === String(id))?.name ?? '';
        setData((prev) => {
          const consumptionsList = payload.consumptions.map((i, idx) => ({
            id: Date.now() + idx,
            productId: i.productId,
            productName: productName(i.productId),
            quantity: i.quantity,
          }));
          const resultsList = payload.results.map((i, idx) => ({
            id: Date.now() + 500 + idx,
            productId: i.productId,
            productName: productName(i.productId),
            quantity: i.quantity,
          }));
          const patch = {
            ...payload,
            productName: selectedRecipe?.productName ?? '',
            productId: selectedRecipe?.productId ?? null,
            consumptions: consumptionsList,
            results: resultsList,
            producedQuantity: resultsList.reduce((sum, r) => sum + r.quantity, 0),
          };
          if (editing) {
            return {
              ...prev,
              productionOrders: prev.productionOrders.map((o) =>
                o.id === editing.id ? { ...o, ...patch } : o
              ),
            };
          }
          const id = Math.max(0, ...prev.productionOrders.map((o) => Number(o.id) || 0)) + 1;
          return {
            ...prev,
            productionOrders: [
              { id, createdAt: nowIso, updatedAt: nowIso, ...patch },
              ...prev.productionOrders,
            ],
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
      await api.delete(`/production-orders/${deleting.id}`);
      await load();
    } catch {
      setMocked(true);
      setData((prev) => ({
        ...prev,
        productionOrders: prev.productionOrders.filter((o) => o.id !== deleting.id),
      }));
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
          <h1 className="h4 mb-1 fw-semibold">Ordens de produção</h1>
          <p className="mb-0 text-muted small">Planejamento e acompanhamento da produção</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openNew}>
          <Icon name="plus" size={16} className="me-1" />
          Nova ordem
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
              <span className="text-muted small text-uppercase">Ordens</span>
              <div className="fs-5 fw-semibold">{stats.total}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Abertas</span>
              <div className="fs-5 fw-semibold text-primary">{stats.open}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Em andamento</span>
              <div className="fs-5 fw-semibold text-warning">{stats.inProgress}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Concluídas</span>
              <div className="fs-5 fw-semibold text-success">{stats.completed}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex align-items-center gap-2 flex-wrap">
          <div className="input-group input-group-sm" style={{ maxWidth: 320 }}>
            <span className="input-group-text">
              <Icon name="search" size={14} />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar produto ou nº da ordem..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-select form-select-sm"
            style={{ maxWidth: 180 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos os status</option>
            {Object.entries(STATUS_META).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th style={{ width: 40 }} />
                <th>Nº</th>
                <th>Produto</th>
                <th className="text-end">Planejado</th>
                <th style={{ minWidth: 160 }}>Produzido</th>
                <th>Programada</th>
                <th>Status</th>
                <th className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-4">
                    Nenhuma ordem encontrada.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <OrderRows
                    key={o.id}
                    order={o}
                    expanded={expanded.has(o.id)}
                    onToggle={() => toggleExpand(o.id)}
                    onEdit={() => openEdit(o)}
                    onDelete={() => setDeleting(o)}
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
          title={editing ? `Editar ordem #${editing.id}` : 'Nova ordem de produção'}
          icon="tool"
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
                form="order-form"
                className="btn btn-primary"
                disabled={saving || !formValid}
              >
                {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar'}
              </button>
            </>
          }
        >
          <form id="order-form" onSubmit={submit}>
            {error && (
              <div className="alert alert-danger py-2 small" role="alert">
                {error}
              </div>
            )}
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label htmlFor="o-recipe" className="form-label">
                  Receita *
                </label>
                <select
                  id="o-recipe"
                  className="form-select"
                  value={form.recipeId}
                  onChange={(e) => selectRecipe(e.target.value)}
                  required
                >
                  <option value="">Selecione...</option>
                  {data.recipes
                    .filter((r) => r.active !== false)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.productName} · rende {qtyFmt.format(Number(r.yieldQuantity) || 0)}{' '}
                        {unitOf(r.productId)}
                      </option>
                    ))}
                </select>
              </div>
              <div className="col-md-3">
                <label htmlFor="o-planned" className="form-label">
                  Qtd. planejada *
                </label>
                <div className="input-group">
                  <input
                    id="o-planned"
                    type="text"
                    inputMode="decimal"
                    className="form-control"
                    placeholder="0"
                    value={form.plannedQuantity}
                    onChange={(e) => changePlanned(e.target.value)}
                    required
                  />
                  {selectedRecipe && unitOf(selectedRecipe.productId) && (
                    <span className="input-group-text">{unitOf(selectedRecipe.productId)}</span>
                  )}
                </div>
              </div>
              <div className="col-md-3">
                <label htmlFor="o-status" className="form-label">
                  Status
                </label>
                <select
                  id="o-status"
                  className="form-select"
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  {Object.entries(STATUS_META).map(([key, meta]) => (
                    <option key={key} value={key}>
                      {meta.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label htmlFor="o-scheduled" className="form-label">
                  Programada para
                </label>
                <input
                  id="o-scheduled"
                  type="datetime-local"
                  className="form-control"
                  value={form.scheduledDate}
                  onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="o-notes" className="form-label">
                  Observações
                </label>
                <input
                  id="o-notes"
                  type="text"
                  className="form-control"
                  maxLength="1000"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>

            <ItemEditor
              title="Consumos previstos"
              hint="Preenchidos automaticamente pela receita"
              items={form.consumptions}
              products={activeProducts}
              usedIds={usedConsumptionIds}
              unitOf={unitOf}
              onSet={consumptions.set}
              onAdd={consumptions.add}
              onRemove={consumptions.remove}
            />

            <ItemEditor
              title="Produtos resultantes"
              hint="O que a ordem efetivamente produziu"
              items={form.results}
              products={activeProducts}
              usedIds={usedResultIds}
              unitOf={unitOf}
              onSet={results.set}
              onAdd={results.add}
              onRemove={results.remove}
            />
          </form>
        </Modal>
      )}

      {deleting && (
        <Modal
          title="Excluir ordem"
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
          <p className="mb-0">
            Excluir a ordem <strong>#{deleting.id}</strong> de{' '}
            <strong>{deleting.productName}</strong>? Esta ação não pode ser desfeita.
          </p>
        </Modal>
      )}
    </div>
  );
}

function ItemEditor({ title, hint, items, products, usedIds, unitOf, onSet, onAdd, onRemove }) {
  return (
    <>
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
        <h6 className="text-muted text-uppercase small fw-semibold mb-0">
          {title}
          {hint && <span className="fw-normal text-capitalize"> — {hint}</span>}
        </h6>
        <button type="button" className="btn btn-sm btn-outline-primary" onClick={onAdd}>
          <Icon name="plus" size={14} className="me-1" />
          Adicionar
        </button>
      </div>
      {items.length === 0 ? (
        <p className="text-muted small text-center border rounded py-3 mb-3">
          Nenhum item — clique em "Adicionar".
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
              {items.map((item, index) => (
                <tr key={index}>
                  <td>
                    <select
                      className="form-select form-select-sm"
                      value={item.productId}
                      onChange={(e) => onSet(index, { productId: e.target.value })}
                      required
                    >
                      <option value="">Selecione...</option>
                      {products
                        .filter(
                          (p) =>
                            String(p.id) === item.productId || !usedIds.has(String(p.id))
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
                        onChange={(e) => onSet(index, { quantity: e.target.value })}
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
                      onClick={() => onRemove(index)}
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
    </>
  );
}

function OrderRows({ order, expanded, onToggle, onEdit, onDelete, unitOf }) {
  const meta = STATUS_META[order.status] ?? STATUS_META.OPEN;
  const planned = Number(order.plannedQuantity) || 0;
  const produced = Number(order.producedQuantity) || 0;
  const pct = planned > 0 ? Math.min(100, Math.round((produced / planned) * 100)) : 0;
  const unit = unitOf(order.productId);
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
        <td className="fw-semibold">#{order.id}</td>
        <td className="fw-medium">{order.productName}</td>
        <td className="text-end">
          {qtyFmt.format(planned)}
          {unit ? ` ${unit}` : ''}
        </td>
        <td>
          <div className="d-flex align-items-center gap-2">
            <div className="progress flex-grow-1" style={{ height: 6 }}>
              <div
                className={`progress-bar ${pct >= 100 ? 'bg-success' : 'bg-warning'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="small text-muted text-nowrap">
              {qtyFmt.format(produced)} · {pct}%
            </span>
          </div>
        </td>
        <td className="text-nowrap text-muted">
          {order.scheduledDate ? dateFmt.format(new Date(order.scheduledDate)) : '—'}
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
              onClick={onEdit}
            >
              <Icon name="edit" size={14} />
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
          <td colSpan="8" className="p-0">
            <div className="px-4 py-2">
              <div className="row g-3">
                <div className="col-md-6">
                  <span className="text-muted small text-uppercase fw-semibold">Consumos</span>
                  {(order.consumptions ?? []).length === 0 ? (
                    <p className="text-muted small mb-0 mt-1">Nenhum consumo registrado.</p>
                  ) : (
                    <table className="table table-sm mb-0 mt-1">
                      <tbody>
                        {order.consumptions.map((c) => (
                          <tr key={c.id}>
                            <td className="border-0 ps-0">{c.productName}</td>
                            <td className="border-0 text-end">
                              {qtyFmt.format(Number(c.quantity) || 0)}{' '}
                              {unitOf(c.productId)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                <div className="col-md-6">
                  <span className="text-muted small text-uppercase fw-semibold">Resultados</span>
                  {(order.results ?? []).length === 0 ? (
                    <p className="text-muted small mb-0 mt-1">Nenhum resultado registrado.</p>
                  ) : (
                    <table className="table table-sm mb-0 mt-1">
                      <tbody>
                        {order.results.map((r) => (
                          <tr key={r.id}>
                            <td className="border-0 ps-0">{r.productName}</td>
                            <td className="border-0 text-end fw-semibold">
                              {qtyFmt.format(Number(r.quantity) || 0)}{' '}
                              {unitOf(r.productId)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
              <div className="d-flex gap-3 flex-wrap small text-muted mt-2">
                {order.startedAt && (
                  <span>Início: {dateFmt.format(new Date(order.startedAt))}</span>
                )}
                {order.finishedAt && (
                  <span>Fim: {dateFmt.format(new Date(order.finishedAt))}</span>
                )}
                {order.notes && <span>Obs.: {order.notes}</span>}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
