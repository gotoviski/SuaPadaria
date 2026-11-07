import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { buildEstoqueMock } from '../../mocks/estoqueMock';
import Icon from '../../components/Icons/Icons';
import Modal from '../../components/Modal/Modal';
import styles from '../../styles/bsTheme.module.css';

const TYPE_META = {
  ENTRY: { label: 'Entrada', badge: 'text-bg-success', sign: '+', text: 'text-success' },
  EXIT: { label: 'Saída', badge: 'text-bg-danger', sign: '−', text: 'text-danger' },
  ADJUSTMENT: { label: 'Ajuste', badge: 'text-bg-warning', sign: '±', text: 'text-warning' },
};

const REASON_SUGGESTIONS = {
  ENTRY: ['Compra', 'Produção do dia', 'Devolução de cliente', 'Transferência recebida'],
  EXIT: ['Venda', 'Consumo em produção', 'Perda por vencimento', 'Avaria', 'Transferência enviada'],
  ADJUSTMENT: ['Ajuste de inventário', 'Correção de lançamento', 'Contagem cíclica'],
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

const EMPTY_FORM = {
  type: 'ENTRY',
  productId: '',
  locationId: '',
  batchId: '',
  quantity: '',
  movementDate: '',
  reason: '',
  reference: '',
  notes: '',
};

export default function MovimentacoesPage() {
  const [data, setData] = useState(null);
  const [mocked, setMocked] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const mock = buildEstoqueMock();
    const endpoints = {
      stockMovements: '/stock-movements',
      storageLocations: '/storage-locations',
      products: '/products',
      stockBatches: '/stock-batches',
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

  const movements = useMemo(() => {
    let list = [...(data?.stockMovements ?? [])].sort(
      (a, b) => new Date(b.movementDate ?? b.createdAt) - new Date(a.movementDate ?? a.createdAt)
    );
    if (typeFilter) list = list.filter((m) => m.type === typeFilter);
    if (locationFilter) list = list.filter((m) => String(m.locationId) === locationFilter);
    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (m) =>
          (m.productName ?? '').toLowerCase().includes(term) ||
          (m.reason ?? '').toLowerCase().includes(term) ||
          (m.reference ?? '').toLowerCase().includes(term) ||
          (m.batchNumber ?? '').toLowerCase().includes(term)
      );
    }
    return list;
  }, [data, search, typeFilter, locationFilter]);

  const stats = useMemo(() => {
    const list = data?.stockMovements ?? [];
    return {
      total: list.length,
      entries: list.filter((m) => m.type === 'ENTRY').length,
      exits: list.filter((m) => m.type === 'EXIT').length,
      adjustments: list.filter((m) => m.type === 'ADJUSTMENT').length,
    };
  }, [data]);

  const batchOptions = useMemo(() => {
    if (!form.productId) return [];
    return (data?.stockBatches ?? []).filter(
      (b) =>
        String(b.productId) === form.productId &&
        (!form.locationId || String(b.locationId) === form.locationId)
    );
  }, [data, form.productId, form.locationId]);

  function openNew() {
    setForm({ ...EMPTY_FORM, movementDate: nowLocalInput() });
    setError(null);
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setForm(EMPTY_FORM);
  }

  const formValid =
    form.productId !== '' &&
    form.locationId !== '' &&
    parseAmount(form.quantity) > 0 &&
    form.movementDate !== '';

  async function submit(e) {
    e.preventDefault();
    if (!formValid) return;
    setSaving(true);
    setError(null);
    const payload = {
      productId: Number(form.productId),
      locationId: Number(form.locationId),
      batchId: form.batchId ? Number(form.batchId) : null,
      type: form.type,
      quantity: parseAmount(form.quantity),
      reason: form.reason.trim() || null,
      reference: form.reference.trim() || null,
      movementDate: new Date(form.movementDate).toISOString(),
      notes: form.notes.trim() || null,
    };
    let failed = false;
    try {
      await api.post('/stock-movements', payload);
      await load();
    } catch (err) {
      if (!mocked) {
        failed = true;
        setError(err?.message ?? 'Erro ao registrar movimentação.');
      } else {
        const product = data.products.find((p) => String(p.id) === form.productId);
        const location = data.storageLocations.find((l) => String(l.id) === form.locationId);
        const batch = batchOptions.find((b) => String(b.id) === form.batchId);
        setData((prev) => ({
          ...prev,
          stockMovements: [
            {
              id: Math.max(0, ...prev.stockMovements.map((m) => Number(m.id) || 0)) + 1,
              ...payload,
              productName: product?.name ?? '',
              locationName: location?.name ?? '',
              batchNumber: batch?.batchNumber ?? null,
              createdAt: payload.movementDate,
              updatedAt: payload.movementDate,
            },
            ...prev.stockMovements,
          ],
        }));
      }
    } finally {
      setSaving(false);
      if (!failed) closeModal();
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
          <h1 className="h4 mb-1 fw-semibold">Movimentações de estoque</h1>
          <p className="mb-0 text-muted small">Entradas, saídas e ajustes de estoque</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openNew}>
          <Icon name="plus" size={16} className="me-1" />
          Nova movimentação
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
              <span className="text-muted small text-uppercase">Entradas</span>
              <div className="fs-5 fw-semibold text-success">{stats.entries}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Saídas</span>
              <div className="fs-5 fw-semibold text-danger">{stats.exits}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Ajustes</span>
              <div className="fs-5 fw-semibold text-warning">{stats.adjustments}</div>
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
              placeholder="Buscar produto, motivo, ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-select form-select-sm"
            style={{ maxWidth: 170 }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">Todos os tipos</option>
            {Object.entries(TYPE_META).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>
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
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Data</th>
                <th>Produto</th>
                <th>Local</th>
                <th>Lote</th>
                <th>Tipo</th>
                <th className="text-end">Quantidade</th>
                <th>Motivo</th>
                <th>Ref.</th>
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-4">
                    Nenhuma movimentação encontrada.
                  </td>
                </tr>
              ) : (
                movements.map((m) => {
                  const meta = TYPE_META[m.type] ?? TYPE_META.ADJUSTMENT;
                  return (
                    <tr key={m.id}>
                      <td className="text-nowrap text-muted">
                        {m.movementDate ? dateFmt.format(new Date(m.movementDate)) : '—'}
                      </td>
                      <td className="fw-medium">{m.productName}</td>
                      <td>{m.locationName}</td>
                      <td>{m.batchNumber || '—'}</td>
                      <td>
                        <span className={`badge ${meta.badge}`}>{meta.label}</span>
                      </td>
                      <td className={`text-end fw-semibold ${meta.text}`}>
                        {meta.sign} {qtyFmt.format(Number(m.quantity) || 0)}
                        {unitOf(m.productId) ? ` ${unitOf(m.productId)}` : ''}
                      </td>
                      <td>{m.reason || '—'}</td>
                      <td>{m.reference || '—'}</td>
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
          title="Nova movimentação"
          icon="move"
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
                form="movement-form"
                className="btn btn-primary"
                disabled={saving || !formValid}
              >
                {saving ? 'Registrando...' : 'Registrar'}
              </button>
            </>
          }
        >
          <form id="movement-form" onSubmit={submit}>
            {error && (
              <div className="alert alert-danger py-2 small" role="alert">
                {error}
              </div>
            )}
            <div className="row g-3">
              <div className="col-md-4">
                <label htmlFor="m-type" className="form-label">
                  Tipo *
                </label>
                <select
                  id="m-type"
                  className="form-select"
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  required
                >
                  {Object.entries(TYPE_META).map(([key, meta]) => (
                    <option key={key} value={key}>
                      {meta.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-8">
                <label htmlFor="m-product" className="form-label">
                  Produto *
                </label>
                <select
                  id="m-product"
                  className="form-select"
                  value={form.productId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, productId: e.target.value, batchId: '' }))
                  }
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
              <div className="col-md-6">
                <label htmlFor="m-location" className="form-label">
                  Local *
                </label>
                <select
                  id="m-location"
                  className="form-select"
                  value={form.locationId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, locationId: e.target.value, batchId: '' }))
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
              <div className="col-md-6">
                <label htmlFor="m-batch" className="form-label">
                  Lote
                </label>
                <select
                  id="m-batch"
                  className="form-select"
                  value={form.batchId}
                  onChange={(e) => setForm((f) => ({ ...f, batchId: e.target.value }))}
                  disabled={!form.productId}
                >
                  <option value="">Sem lote</option>
                  {batchOptions.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batchNumber}
                      {b.expirationDate ? ` · venc. ${b.expirationDate}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label htmlFor="m-quantity" className="form-label">
                  Quantidade *
                </label>
                <div className="input-group">
                  <input
                    id="m-quantity"
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
              <div className="col-md-4">
                <label htmlFor="m-date" className="form-label">
                  Data *
                </label>
                <input
                  id="m-date"
                  type="datetime-local"
                  className="form-control"
                  value={form.movementDate}
                  onChange={(e) => setForm((f) => ({ ...f, movementDate: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-4">
                <label htmlFor="m-reference" className="form-label">
                  Referência
                </label>
                <input
                  id="m-reference"
                  type="text"
                  className="form-control"
                  placeholder="Ex.: NF-1234, OP-100"
                  value={form.reference}
                  onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
                />
              </div>
              <div className="col-12">
                <label htmlFor="m-reason" className="form-label">
                  Motivo
                </label>
                <input
                  id="m-reason"
                  type="text"
                  className="form-control"
                  list="reason-suggestions"
                  placeholder="Ex.: compra, venda, perda..."
                  value={form.reason}
                  onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                />
                <datalist id="reason-suggestions">
                  {(REASON_SUGGESTIONS[form.type] ?? []).map((r) => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
              </div>
              <div className="col-12">
                <label htmlFor="m-notes" className="form-label">
                  Observações
                </label>
                <textarea
                  id="m-notes"
                  className="form-control"
                  rows="2"
                  maxLength="1000"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
