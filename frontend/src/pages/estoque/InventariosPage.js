import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { buildEstoqueMock } from '../../mocks/estoqueMock';
import Icon from '../../components/Icons/Icons';
import Modal from '../../components/Modal/Modal';
import styles from '../../styles/bsTheme.module.css';

const STATUS_META = {
  OPEN: { label: 'Em aberto', badge: 'text-bg-warning' },
  CLOSED: { label: 'Fechado', badge: 'text-bg-success' },
};

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

const EMPTY_FORM = { locationId: '', inventoryDate: '', status: 'OPEN', notes: '', items: [] };

export default function InventariosPage() {
  const [data, setData] = useState(null);
  const [mocked, setMocked] = useState(false);
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expanded, setExpanded] = useState(() => new Set());

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const mock = buildEstoqueMock();
    const endpoints = {
      inventories: '/inventories',
      stockBalances: '/stock-balances',
      storageLocations: '/storage-locations',
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

  const expectedFor = useCallback(
    (productId, locationId) => {
      const balance = (data?.stockBalances ?? []).find(
        (b) => String(b.productId) === String(productId) && String(b.locationId) === String(locationId)
      );
      return balance ? Number(balance.quantity) : null;
    },
    [data]
  );

  const divergenceCount = useCallback(
    (inv) => (inv.items ?? []).filter((i) => Number(i.difference ?? 0) !== 0).length,
    []
  );

  const inventories = useMemo(() => {
    let list = [...(data?.inventories ?? [])].sort(
      (a, b) => new Date(b.inventoryDate) - new Date(a.inventoryDate)
    );
    if (locationFilter) list = list.filter((i) => String(i.locationId) === locationFilter);
    if (statusFilter) list = list.filter((i) => i.status === statusFilter);
    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (i) =>
          (i.locationName ?? '').toLowerCase().includes(term) ||
          (i.notes ?? '').toLowerCase().includes(term) ||
          String(i.id).includes(term)
      );
    }
    return list;
  }, [data, search, locationFilter, statusFilter]);

  const stats = useMemo(() => {
    const list = data?.inventories ?? [];
    return {
      total: list.length,
      open: list.filter((i) => i.status === 'OPEN').length,
      closed: list.filter((i) => i.status === 'CLOSED').length,
      divergent: list.filter((i) => divergenceCount(i) > 0).length,
    };
  }, [data, divergenceCount]);

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
    setForm({ ...EMPTY_FORM, inventoryDate: nowLocalInput() });
    setError(null);
    setModalOpen(true);
  }

  function openEdit(inv) {
    setEditing(inv);
    const d = new Date(inv.inventoryDate);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    setForm({
      locationId: String(inv.locationId),
      inventoryDate: d.toISOString().slice(0, 16),
      status: inv.status ?? 'OPEN',
      notes: inv.notes ?? '',
      items: (inv.items ?? []).map((i) => ({
        productId: String(i.productId),
        expected: String(i.expectedQuantity ?? 0).replace('.', ','),
        counted: String(i.countedQuantity ?? 0).replace('.', ','),
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

  function addItem() {
    setForm((f) => ({ ...f, items: [...f.items, { productId: '', expected: '', counted: '' }] }));
  }

  function removeItem(index) {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
  }

  function selectProduct(index, productId) {
    const patch = { productId };
    const expected = expectedFor(productId, form.locationId);
    const current = form.items[index];
    if (expected != null && current.expected === '') {
      patch.expected = String(expected).replace('.', ',');
    }
    setItem(index, patch);
  }

  function importBalances() {
    const rows = (data?.stockBalances ?? [])
      .filter((b) => String(b.locationId) === form.locationId)
      .map((b) => ({
        productId: String(b.productId),
        expected: String(b.quantity ?? 0).replace('.', ','),
        counted: String(b.quantity ?? 0).replace('.', ','),
      }));
    setForm((f) => ({ ...f, items: rows }));
  }

  const usedProductIds = useMemo(
    () => new Set(form.items.map((i) => i.productId).filter(Boolean)),
    [form.items]
  );

  const activeProducts = useMemo(
    () => (data?.products ?? []).filter((p) => p.active !== false),
    [data]
  );

  const formValid =
    form.locationId !== '' &&
    form.inventoryDate !== '' &&
    form.items.length > 0 &&
    form.items.every(
      (i) => i.productId !== '' && parseAmount(i.expected) >= 0 && i.expected !== '' && i.counted !== '' && parseAmount(i.counted) >= 0
    );

  async function submit(e) {
    e.preventDefault();
    if (!formValid) return;
    setSaving(true);
    setError(null);
    const payload = {
      locationId: Number(form.locationId),
      inventoryDate: new Date(form.inventoryDate).toISOString(),
      status: form.status,
      notes: form.notes.trim() || null,
      items: form.items.map((i) => ({
        productId: Number(i.productId),
        expectedQuantity: parseAmount(i.expected),
        countedQuantity: parseAmount(i.counted),
      })),
    };
    let failed = false;
    try {
      if (editing) {
        await api.put(`/inventories/${editing.id}`, payload);
      } else {
        await api.post('/inventories', payload);
      }
      await load();
    } catch (err) {
      if (!mocked) {
        failed = true;
        setError(err?.message ?? 'Erro ao salvar inventário.');
      } else {
        const productName = (id) =>
          data.products.find((p) => String(p.id) === String(id))?.name ?? '';
        const locationName =
          data.storageLocations.find((l) => String(l.id) === form.locationId)?.name ?? '';
        setData((prev) => {
          const items = payload.items.map((i, idx) => ({
            id: Date.now() + idx,
            productId: i.productId,
            productName: productName(i.productId),
            expectedQuantity: i.expectedQuantity,
            countedQuantity: i.countedQuantity,
            difference: i.countedQuantity - i.expectedQuantity,
          }));
          if (editing) {
            return {
              ...prev,
              inventories: prev.inventories.map((inv) =>
                inv.id === editing.id
                  ? { ...inv, ...payload, locationName: locationName || inv.locationName, items }
                  : inv
              ),
            };
          }
          const id = Math.max(0, ...prev.inventories.map((i) => Number(i.id) || 0)) + 1;
          return {
            ...prev,
            inventories: [
              { id, ...payload, locationName, items, createdAt: payload.inventoryDate, updatedAt: payload.inventoryDate },
              ...prev.inventories,
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
      await api.delete(`/inventories/${deleting.id}`);
      await load();
    } catch {
      setMocked(true);
      setData((prev) => ({
        ...prev,
        inventories: prev.inventories.filter((i) => i.id !== deleting.id),
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
          <h1 className="h4 mb-1 fw-semibold">Inventários</h1>
          <p className="mb-0 text-muted small">Contagem física e divergências de estoque</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openNew}>
          <Icon name="plus" size={16} className="me-1" />
          Novo inventário
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
              <span className="text-muted small text-uppercase">Inventários</span>
              <div className="fs-5 fw-semibold">{stats.total}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Em aberto</span>
              <div className="fs-5 fw-semibold text-warning">{stats.open}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Fechados</span>
              <div className="fs-5 fw-semibold text-success">{stats.closed}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Com divergência</span>
              <div className={`fs-5 fw-semibold ${stats.divergent > 0 ? 'text-danger' : ''}`}>
                {stats.divergent}
              </div>
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
              placeholder="Buscar por nº, local, obs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-select form-select-sm"
            style={{ maxWidth: 220 }}
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            <option value="">Todos os locais</option>
            {data.storageLocations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <select
            className="form-select form-select-sm"
            style={{ maxWidth: 170 }}
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
                <th>Local</th>
                <th>Data</th>
                <th>Itens</th>
                <th>Divergências</th>
                <th>Status</th>
                <th className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {inventories.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-4">
                    Nenhum inventário encontrado.
                  </td>
                </tr>
              ) : (
                inventories.map((inv) => {
                  const meta = STATUS_META[inv.status] ?? STATUS_META.OPEN;
                  const divergent = divergenceCount(inv);
                  const items = inv.items ?? [];
                  return (
                    <InventoryRows
                      key={inv.id}
                      inv={inv}
                      meta={meta}
                      divergent={divergent}
                      items={items}
                      expanded={expanded.has(inv.id)}
                      onToggle={() => toggleExpand(inv.id)}
                      onEdit={() => openEdit(inv)}
                      onDelete={() => setDeleting(inv)}
                      unitOf={unitOf}
                    />
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <Modal
          title={editing ? `Editar inventário #${editing.id}` : 'Novo inventário'}
          icon="clipboard"
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
                form="inventory-form"
                className="btn btn-primary"
                disabled={saving || !formValid}
              >
                {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar'}
              </button>
            </>
          }
        >
          <form id="inventory-form" onSubmit={submit}>
            {error && (
              <div className="alert alert-danger py-2 small" role="alert">
                {error}
              </div>
            )}
            <div className="row g-3 mb-3">
              <div className="col-md-5">
                <label htmlFor="i-location" className="form-label">
                  Local *
                </label>
                <select
                  id="i-location"
                  className="form-select"
                  value={form.locationId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, locationId: e.target.value, items: [] }))
                  }
                  required
                >
                  <option value="">Selecione...</option>
                  {data.storageLocations
                    .filter((l) => l.active !== false)
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="col-md-4">
                <label htmlFor="i-date" className="form-label">
                  Data *
                </label>
                <input
                  id="i-date"
                  type="datetime-local"
                  className="form-control"
                  value={form.inventoryDate}
                  onChange={(e) => setForm((f) => ({ ...f, inventoryDate: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-3">
                <label htmlFor="i-status" className="form-label">
                  Status
                </label>
                <select
                  id="i-status"
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
            </div>

            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
              <h6 className="text-muted text-uppercase small fw-semibold mb-0">
                Itens contados
              </h6>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={importBalances}
                  disabled={!form.locationId}
                  title="Preenche os itens com os saldos atuais do local"
                >
                  <Icon name="package" size={14} className="me-1" />
                  Importar saldos do local
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={addItem}
                >
                  <Icon name="plus" size={14} className="me-1" />
                  Adicionar item
                </button>
              </div>
            </div>

            {form.items.length === 0 ? (
              <p className="text-muted small text-center border rounded py-3 mb-3">
                Nenhum item — adicione manualmente ou importe os saldos do local.
              </p>
            ) : (
              <div className="table-responsive border rounded mb-3">
                <table className="table table-sm align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th style={{ width: 130 }}>Esperado</th>
                      <th style={{ width: 130 }}>Contado</th>
                      <th style={{ width: 100 }} className="text-end">
                        Diferença
                      </th>
                      <th style={{ width: 48 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {form.items.map((item, index) => {
                      const diff = parseAmount(item.counted) - parseAmount(item.expected);
                      return (
                        <tr key={index}>
                          <td>
                            <select
                              className="form-select form-select-sm"
                              value={item.productId}
                              onChange={(e) => selectProduct(index, e.target.value)}
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
                            <input
                              type="text"
                              inputMode="decimal"
                              className="form-control form-control-sm"
                              placeholder="0"
                              value={item.expected}
                              onChange={(e) => setItem(index, { expected: e.target.value })}
                              required
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              inputMode="decimal"
                              className="form-control form-control-sm"
                              placeholder="0"
                              value={item.counted}
                              onChange={(e) => setItem(index, { counted: e.target.value })}
                              required
                            />
                          </td>
                          <td
                            className={`text-end fw-semibold ${
                              item.expected === '' || item.counted === ''
                                ? 'text-muted'
                                : diff === 0
                                  ? 'text-success'
                                  : 'text-danger'
                            }`}
                          >
                            {item.expected === '' || item.counted === ''
                              ? '—'
                              : `${diff > 0 ? '+' : ''}${qtyFmt.format(diff)}`}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              title="Remover"
                              onClick={() => removeItem(index)}
                            >
                              <Icon name="trash" size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div>
              <label htmlFor="i-notes" className="form-label">
                Observações
              </label>
              <textarea
                id="i-notes"
                className="form-control"
                rows="2"
                maxLength="1000"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <Modal
          title="Excluir inventário"
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
            Excluir o inventário <strong>#{deleting.id}</strong> de{' '}
            <strong>{deleting.locationName}</strong>? Todos os itens serão removidos e a ação
            não pode ser desfeita.
          </p>
        </Modal>
      )}
    </div>
  );
}

function InventoryRows({ inv, meta, divergent, items, expanded, onToggle, onEdit, onDelete, unitOf }) {
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
        <td className="fw-semibold">#{inv.id}</td>
        <td className="fw-medium">{inv.locationName}</td>
        <td className="text-nowrap text-muted">
          {inv.inventoryDate ? dateFmt.format(new Date(inv.inventoryDate)) : '—'}
        </td>
        <td>{items.length}</td>
        <td>
          {divergent > 0 ? (
            <span className="text-danger fw-semibold">{divergent}</span>
          ) : (
            <span className="text-muted">0</span>
          )}
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
              {items.length === 0 ? (
                <span className="text-muted small">Nenhum item neste inventário.</span>
              ) : (
                <table className="table table-sm mb-0" style={{ maxWidth: 720 }}>
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th className="text-end">Esperado</th>
                      <th className="text-end">Contado</th>
                      <th className="text-end">Diferença</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((i) => {
                      const diff = Number(i.difference ?? 0);
                      const unit = unitOf(i.productId);
                      return (
                        <tr key={i.id}>
                          <td className="border-0 ps-0">{i.productName}</td>
                          <td className="border-0 text-end">
                            {qtyFmt.format(Number(i.expectedQuantity) || 0)}
                            {unit ? ` ${unit}` : ''}
                          </td>
                          <td className="border-0 text-end">
                            {qtyFmt.format(Number(i.countedQuantity) || 0)}
                            {unit ? ` ${unit}` : ''}
                          </td>
                          <td
                            className={`border-0 text-end fw-semibold ${
                              diff === 0 ? 'text-success' : 'text-danger'
                            }`}
                          >
                            {diff > 0 ? '+' : ''}
                            {qtyFmt.format(diff)}
                            {unit ? ` ${unit}` : ''}
                          </td>
                        </tr>
                      );
                    })}
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
