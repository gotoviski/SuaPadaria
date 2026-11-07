import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { buildComprasMock } from '../../mocks/comprasMock';
import Icon from '../../components/Icons/Icons';
import Modal from '../../components/Modal/Modal';
import styles from '../../styles/bsTheme.module.css';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const qtyFmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 });
const dateFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
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

const EMPTY_FORM = { supplierId: '', purchaseDate: '', notes: '', items: [] };

export default function ComprasPage() {
  const [data, setData] = useState(null);
  const [mocked, setMocked] = useState(false);
  const [search, setSearch] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [expanded, setExpanded] = useState(() => new Set());

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const mock = buildComprasMock();
    const endpoints = {
      purchases: '/purchases',
      suppliers: '/suppliers',
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

  const purchases = useMemo(() => {
    let list = [...(data?.purchases ?? [])].sort(
      (a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate)
    );
    if (supplierFilter) list = list.filter((p) => String(p.supplierId) === supplierFilter);
    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (p) =>
          (p.supplierName ?? '').toLowerCase().includes(term) ||
          (p.notes ?? '').toLowerCase().includes(term) ||
          String(p.id).includes(term)
      );
    }
    return list;
  }, [data, search, supplierFilter]);

  const stats = useMemo(() => {
    const list = data?.purchases ?? [];
    return {
      total: list.length,
      amount: list.reduce((sum, p) => sum + (Number(p.total) || 0), 0),
      items: list.reduce((sum, p) => sum + (p.items ?? []).length, 0),
      suppliers: new Set(list.map((p) => p.supplierId)).size,
    };
  }, [data]);

  const formTotal = useMemo(
    () =>
      form.items.reduce(
        (sum, i) => sum + parseAmount(i.quantity) * parseAmount(i.unitPrice),
        0
      ),
    [form.items]
  );

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
    setForm({ ...EMPTY_FORM, purchaseDate: nowLocalInput(), items: [{ productId: '', quantity: '', unitPrice: '' }] });
    setError(null);
    setModalOpen(true);
  }

  function openEdit(purchase) {
    setEditing(purchase);
    setForm({
      supplierId: String(purchase.supplierId),
      purchaseDate: toLocalInput(purchase.purchaseDate),
      notes: purchase.notes ?? '',
      items: (purchase.items ?? []).map((i) => ({
        productId: String(i.productId),
        quantity: String(i.quantity ?? '').replace('.', ','),
        unitPrice: String(i.unitPrice ?? '').replace('.', ','),
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
      items: f.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  }

  const usedProductIds = useMemo(
    () => new Set(form.items.map((i) => i.productId).filter(Boolean)),
    [form.items]
  );

  const activeProducts = useMemo(
    () => (data?.products ?? []).filter((p) => p.active !== false),
    [data]
  );

  const activeSuppliers = useMemo(
    () => (data?.suppliers ?? []).filter((s) => s.active !== false),
    [data]
  );

  const formValid =
    form.supplierId !== '' &&
    form.items.length > 0 &&
    form.items.every(
      (i) => i.productId !== '' && parseAmount(i.quantity) > 0 && parseAmount(i.unitPrice) >= 0
    );

  async function submit(e) {
    e.preventDefault();
    if (!formValid) return;
    setSaving(true);
    setError(null);
    const payload = {
      supplierId: Number(form.supplierId),
      purchaseDate: form.purchaseDate ? new Date(form.purchaseDate).toISOString() : null,
      notes: form.notes.trim() || null,
      items: form.items.map((i) => ({
        productId: Number(i.productId),
        quantity: parseAmount(i.quantity),
        unitPrice: parseAmount(i.unitPrice),
      })),
    };
    let failed = false;
    try {
      if (editing) {
        await api.put(`/purchases/${editing.id}`, payload);
      } else {
        await api.post('/purchases', payload);
      }
      await load();
    } catch (err) {
      if (!mocked) {
        failed = true;
        setError(err?.message ?? 'Erro ao salvar compra.');
      } else {
        const productName = (id) =>
          data.products.find((p) => String(p.id) === String(id))?.name ?? '';
        const supplierName =
          data.suppliers.find((s) => String(s.id) === form.supplierId)?.name ?? '';
        setData((prev) => {
          const items = payload.items.map((i, idx) => ({
            id: Date.now() + idx,
            productId: i.productId,
            productName: productName(i.productId),
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: i.quantity * i.unitPrice,
          }));
          const patch = {
            ...payload,
            purchaseDate: payload.purchaseDate ?? new Date().toISOString(),
            supplierName,
            items,
            total: items.reduce((sum, i) => sum + i.totalPrice, 0),
          };
          if (editing) {
            return {
              ...prev,
              purchases: prev.purchases.map((p) =>
                p.id === editing.id ? { ...p, ...patch } : p
              ),
            };
          }
          const id = Math.max(0, ...prev.purchases.map((p) => Number(p.id) || 0)) + 1;
          return {
            ...prev,
            purchases: [
              { id, createdAt: patch.purchaseDate, updatedAt: patch.purchaseDate, ...patch },
              ...prev.purchases,
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
      await api.delete(`/purchases/${deleting.id}`);
      await load();
    } catch {
      setMocked(true);
      setData((prev) => ({
        ...prev,
        purchases: prev.purchases.filter((p) => p.id !== deleting.id),
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
          <h1 className="h4 mb-1 fw-semibold">Compras</h1>
          <p className="mb-0 text-muted small">Entradas de insumos e notas de compra</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openNew}>
          <Icon name="plus" size={16} className="me-1" />
          Nova compra
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
              <span className="text-muted small text-uppercase">Compras</span>
              <div className="fs-5 fw-semibold">{stats.total}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Valor total</span>
              <div className="fs-5 fw-semibold text-danger">{currency.format(stats.amount)}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Itens</span>
              <div className="fs-5 fw-semibold">{stats.items}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Fornecedores</span>
              <div className="fs-5 fw-semibold">{stats.suppliers}</div>
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
              placeholder="Buscar fornecedor, nº ou obs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-select form-select-sm"
            style={{ maxWidth: 240 }}
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
          >
            <option value="">Todos os fornecedores</option>
            {data.suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
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
                <th>Fornecedor</th>
                <th>Data</th>
                <th>Itens</th>
                <th className="text-end">Total</th>
                <th className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-4">
                    Nenhuma compra encontrada.
                  </td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <PurchaseRows
                    key={p.id}
                    purchase={p}
                    expanded={expanded.has(p.id)}
                    onToggle={() => toggleExpand(p.id)}
                    onEdit={() => openEdit(p)}
                    onDelete={() => setDeleting(p)}
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
          title={editing ? `Editar compra #${editing.id}` : 'Nova compra'}
          icon="truck"
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
                form="purchase-form"
                className="btn btn-primary"
                disabled={saving || !formValid}
              >
                {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar'}
              </button>
            </>
          }
        >
          <form id="purchase-form" onSubmit={submit}>
            {error && (
              <div className="alert alert-danger py-2 small" role="alert">
                {error}
              </div>
            )}
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label htmlFor="p-supplier" className="form-label">
                  Fornecedor *
                </label>
                <select
                  id="p-supplier"
                  className="form-select"
                  value={form.supplierId}
                  onChange={(e) => setForm((f) => ({ ...f, supplierId: e.target.value }))}
                  required
                >
                  <option value="">Selecione...</option>
                  {activeSuppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label htmlFor="p-date" className="form-label">
                  Data da compra
                </label>
                <input
                  id="p-date"
                  type="datetime-local"
                  className="form-control"
                  value={form.purchaseDate}
                  onChange={(e) => setForm((f) => ({ ...f, purchaseDate: e.target.value }))}
                />
              </div>
              <div className="col-md-3">
                <label htmlFor="p-notes" className="form-label">
                  Observações
                </label>
                <input
                  id="p-notes"
                  type="text"
                  className="form-control"
                  maxLength="1000"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-between mb-2">
              <h6 className="text-muted text-uppercase small fw-semibold mb-0">Itens da compra</h6>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    items: [...f.items, { productId: '', quantity: '', unitPrice: '' }],
                  }))
                }
              >
                <Icon name="plus" size={14} className="me-1" />
                Adicionar item
              </button>
            </div>

            <div className="table-responsive border rounded mb-2">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th style={{ width: 120 }}>Qtd.</th>
                    <th style={{ width: 140 }}>Preço unit.</th>
                    <th style={{ width: 110 }} className="text-end">
                      Total
                    </th>
                    <th style={{ width: 48 }} />
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item, index) => (
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
                        <div className="input-group input-group-sm">
                          <span className="input-group-text">R$</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            className="form-control"
                            placeholder="0,00"
                            value={item.unitPrice}
                            onChange={(e) => setItem(index, { unitPrice: e.target.value })}
                            required
                          />
                        </div>
                      </td>
                      <td className="text-end fw-semibold">
                        {currency.format(
                          parseAmount(item.quantity) * parseAmount(item.unitPrice)
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          title="Remover"
                          disabled={form.items.length <= 1}
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              items: f.items.filter((_, i) => i !== index),
                            }))
                          }
                        >
                          <Icon name="trash" size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" className="text-end fw-semibold border-0 pt-2">
                      Total da compra
                    </td>
                    <td className="text-end fw-bold border-0 pt-2">
                      {currency.format(formTotal)}
                    </td>
                    <td className="border-0" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <Modal
          title="Excluir compra"
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
            Excluir a compra <strong>#{deleting.id}</strong> de{' '}
            <strong>{deleting.supplierName}</strong> (
            {currency.format(Number(deleting.total) || 0)})? Esta ação não pode ser desfeita.
          </p>
        </Modal>
      )}
    </div>
  );
}

function PurchaseRows({ purchase, expanded, onToggle, onEdit, onDelete, unitOf }) {
  const items = purchase.items ?? [];
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
        <td className="fw-semibold">#{purchase.id}</td>
        <td>
          <div className="fw-medium">{purchase.supplierName}</div>
          {purchase.notes && <div className="text-muted small">{purchase.notes}</div>}
        </td>
        <td className="text-nowrap text-muted">
          {purchase.purchaseDate ? dateFmt.format(new Date(purchase.purchaseDate)) : '—'}
        </td>
        <td>{items.length}</td>
        <td className="text-end fw-semibold">
          {currency.format(Number(purchase.total) || 0)}
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
          <td colSpan="7" className="p-0">
            <div className="px-4 py-2">
              {items.length === 0 ? (
                <span className="text-muted small">Nenhum item nesta compra.</span>
              ) : (
                <table className="table table-sm mb-0" style={{ maxWidth: 720 }}>
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th className="text-end">Qtd.</th>
                      <th className="text-end">Preço unit.</th>
                      <th className="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((i) => (
                      <tr key={i.id}>
                        <td className="border-0 ps-0">{i.productName}</td>
                        <td className="border-0 text-end">
                          {qtyFmt.format(Number(i.quantity) || 0)} {unitOf(i.productId)}
                        </td>
                        <td className="border-0 text-end">
                          {currency.format(Number(i.unitPrice) || 0)}
                        </td>
                        <td className="border-0 text-end fw-semibold">
                          {currency.format(Number(i.totalPrice) || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
