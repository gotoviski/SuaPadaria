import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { buildProducaoMock } from '../../mocks/producaoMock';
import Icon from '../../components/Icons/Icons';
import Modal from '../../components/Modal/Modal';
import styles from '../../styles/bsTheme.module.css';

const qtyFmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 });
const parseAmount = (value) => Number(String(value).replace(',', '.')) || 0;

const EMPTY_FORM = { orderId: '', productId: '', quantity: '' };

export default function ConsumosPage() {
  const [data, setData] = useState(null);
  const [mocked, setMocked] = useState(false);
  const [search, setSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const mock = buildProducaoMock();
    const endpoints = {
      productionConsumptions: '/production-consumptions',
      productionOrders: '/production-orders',
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
      } else if (key === 'productionConsumptions') {
        next[key] = mock.productionOrders.flatMap((o) =>
          (o.consumptions ?? []).map((c) => ({
            ...c,
            orderId: o.id,
            orderProductName: o.productName,
          }))
        );
        failed += 1;
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

  const orderLabel = useCallback(
    (row) => {
      const order = (data?.productionOrders ?? []).find(
        (o) => String(o.id) === String(row.orderId)
      );
      const name = order?.productName ?? row.orderProductName;
      return name ? `#${row.orderId} · ${name}` : `#${row.orderId}`;
    },
    [data]
  );

  const rows = useMemo(() => {
    let list = [...(data?.productionConsumptions ?? [])].sort(
      (a, b) => Number(b.id) - Number(a.id)
    );
    if (orderFilter) list = list.filter((r) => String(r.orderId) === orderFilter);
    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (r) =>
          (r.productName ?? '').toLowerCase().includes(term) ||
          (r.orderProductName ?? '').toLowerCase().includes(term) ||
          String(r.orderId).includes(term)
      );
    }
    return list;
  }, [data, search, orderFilter]);

  const stats = useMemo(() => {
    const list = data?.productionConsumptions ?? [];
    return {
      total: list.length,
      quantity: list.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0),
      products: new Set(list.map((r) => r.productId)).size,
      orders: new Set(list.map((r) => r.orderId)).size,
    };
  }, [data]);

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    setForm({
      orderId: String(row.orderId),
      productId: String(row.productId),
      quantity: String(row.quantity ?? '').replace('.', ','),
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

  const formValid =
    form.orderId !== '' && form.productId !== '' && parseAmount(form.quantity) > 0;

  async function submit(e) {
    e.preventDefault();
    if (!formValid) return;
    setSaving(true);
    setError(null);
    const payload = {
      orderId: Number(form.orderId),
      productId: Number(form.productId),
      quantity: parseAmount(form.quantity),
    };
    let failed = false;
    try {
      if (editing) {
        await api.put(`/production-consumptions/${editing.id}`, payload);
      } else {
        await api.post('/production-consumptions', payload);
      }
      await load();
    } catch (err) {
      if (!mocked) {
        failed = true;
        setError(err?.message ?? 'Erro ao salvar consumo.');
      } else {
        const productName =
          data.products.find((p) => String(p.id) === form.productId)?.name ?? '';
        const orderProductName =
          data.productionOrders.find((o) => String(o.id) === form.orderId)?.productName ?? '';
        setData((prev) => {
          if (editing) {
            return {
              ...prev,
              productionConsumptions: prev.productionConsumptions.map((r) =>
                r.id === editing.id ? { ...r, ...payload, productName, orderProductName } : r
              ),
            };
          }
          const id =
            Math.max(0, ...prev.productionConsumptions.map((r) => Number(r.id) || 0)) + 1;
          return {
            ...prev,
            productionConsumptions: [
              { id, ...payload, productName, orderProductName },
              ...prev.productionConsumptions,
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
      await api.delete(`/production-consumptions/${deleting.id}`);
      await load();
    } catch {
      setMocked(true);
      setData((prev) => ({
        ...prev,
        productionConsumptions: prev.productionConsumptions.filter(
          (r) => r.id !== deleting.id
        ),
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
          <h1 className="h4 mb-1 fw-semibold">Consumos de produção</h1>
          <p className="mb-0 text-muted small">Insumos consumidos por ordem de produção</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openNew}>
          <Icon name="plus" size={16} className="me-1" />
          Novo consumo
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
              <span className="text-muted small text-uppercase">Registros</span>
              <div className="fs-5 fw-semibold">{stats.total}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Qtd. consumida</span>
              <div className="fs-5 fw-semibold text-danger">{qtyFmt.format(stats.quantity)}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Insumos</span>
              <div className="fs-5 fw-semibold">{stats.products}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Ordens</span>
              <div className="fs-5 fw-semibold">{stats.orders}</div>
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
              placeholder="Buscar insumo ou ordem..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-select form-select-sm"
            style={{ maxWidth: 260 }}
            value={orderFilter}
            onChange={(e) => setOrderFilter(e.target.value)}
          >
            <option value="">Todas as ordens</option>
            {data.productionOrders.map((o) => (
              <option key={o.id} value={o.id}>
                #{o.id} · {o.productName}
              </option>
            ))}
          </select>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Nº</th>
                <th>Ordem</th>
                <th>Insumo</th>
                <th className="text-end">Quantidade</th>
                <th className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-4">
                    Nenhum consumo encontrado.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td className="fw-semibold">#{r.id}</td>
                    <td>{orderLabel(r)}</td>
                    <td className="fw-medium">{r.productName}</td>
                    <td className="text-end fw-semibold">
                      {qtyFmt.format(Number(r.quantity) || 0)}
                      {unitOf(r.productId) ? ` ${unitOf(r.productId)}` : ''}
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          title="Editar"
                          onClick={() => openEdit(r)}
                        >
                          <Icon name="edit" size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          title="Excluir"
                          onClick={() => setDeleting(r)}
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
          title={editing ? `Editar consumo #${editing.id}` : 'Novo consumo'}
          icon="minus-circle"
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
                form="consumption-form"
                className="btn btn-primary"
                disabled={saving || !formValid}
              >
                {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar'}
              </button>
            </>
          }
        >
          <form id="consumption-form" onSubmit={submit}>
            {error && (
              <div className="alert alert-danger py-2 small" role="alert">
                {error}
              </div>
            )}
            <div className="mb-3">
              <label htmlFor="c-order" className="form-label">
                Ordem de produção *
              </label>
              <select
                id="c-order"
                className="form-select"
                value={form.orderId}
                onChange={(e) => setForm((f) => ({ ...f, orderId: e.target.value }))}
                required
              >
                <option value="">Selecione...</option>
                {data.productionOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    #{o.id} · {o.productName}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label htmlFor="c-product" className="form-label">
                Insumo *
              </label>
              <select
                id="c-product"
                className="form-select"
                value={form.productId}
                onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}
                required
              >
                <option value="">Selecione...</option>
                {data.products
                  .filter((p) => p.active !== false)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label htmlFor="c-quantity" className="form-label">
                Quantidade consumida *
              </label>
              <div className="input-group">
                <input
                  id="c-quantity"
                  type="text"
                  inputMode="decimal"
                  className="form-control"
                  placeholder="0"
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                  required
                />
                {form.productId && unitOf(form.productId) && (
                  <span className="input-group-text">{unitOf(form.productId)}</span>
                )}
              </div>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <Modal
          title="Excluir consumo"
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
            Excluir o consumo <strong>#{deleting.id}</strong> ({deleting.productName},{' '}
            {qtyFmt.format(Number(deleting.quantity) || 0)}) da ordem{' '}
            <strong>#{deleting.orderId}</strong>? Esta ação não pode ser desfeita.
          </p>
        </Modal>
      )}
    </div>
  );
}
