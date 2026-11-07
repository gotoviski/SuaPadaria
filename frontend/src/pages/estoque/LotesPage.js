import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { buildEstoqueMock } from '../../mocks/estoqueMock';
import Icon from '../../components/Icons/Icons';
import Modal from '../../components/Modal/Modal';
import styles from '../../styles/bsTheme.module.css';

const WARN_DAYS = 30;

const qtyFmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 });
const dateFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

const parseAmount = (value) => Number(String(value).replace(',', '.')) || 0;

const EMPTY_FORM = {
  productId: '',
  locationId: '',
  batchNumber: '',
  quantity: '',
  manufactureDate: '',
  expirationDate: '',
  notes: '',
};

function expirationStatus(expirationDate) {
  if (!expirationDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.ceil((new Date(`${expirationDate}T00:00:00`) - today) / 86400000);
  if (days < 0) return { key: 'expired', label: `Vencido há ${Math.abs(days)}d`, badge: 'text-bg-danger' };
  if (days <= WARN_DAYS) return { key: 'warning', label: `Vence em ${days}d`, badge: 'text-bg-warning' };
  return { key: 'ok', label: 'Dentro do prazo', badge: 'text-bg-success' };
}

export default function LotesPage() {
  const [data, setData] = useState(null);
  const [mocked, setMocked] = useState(false);
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const mock = buildEstoqueMock();
    const endpoints = {
      stockBatches: '/stock-batches',
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

  const batches = useMemo(() => {
    let list = [...(data?.stockBatches ?? [])].sort((a, b) => {
      const da = a.expirationDate ?? '9999-12-31';
      const db = b.expirationDate ?? '9999-12-31';
      return da.localeCompare(db) || (a.batchNumber ?? '').localeCompare(b.batchNumber ?? '');
    });
    if (locationFilter) list = list.filter((b) => String(b.locationId) === locationFilter);
    if (statusFilter) {
      list = list.filter((b) => expirationStatus(b.expirationDate)?.key === statusFilter);
    }
    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (b) =>
          (b.productName ?? '').toLowerCase().includes(term) ||
          (b.batchNumber ?? '').toLowerCase().includes(term) ||
          (b.locationName ?? '').toLowerCase().includes(term)
      );
    }
    return list;
  }, [data, search, locationFilter, statusFilter]);

  const stats = useMemo(() => {
    const list = data?.stockBatches ?? [];
    const status = list.map((b) => expirationStatus(b.expirationDate)?.key ?? 'none');
    return {
      total: list.length,
      expired: status.filter((s) => s === 'expired').length,
      warning: status.filter((s) => s === 'warning').length,
      ok: status.filter((s) => s === 'ok' || s === 'none').length,
    };
  }, [data]);

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(batch) {
    setEditing(batch);
    setForm({
      productId: String(batch.productId),
      locationId: String(batch.locationId),
      batchNumber: batch.batchNumber ?? '',
      quantity: batch.quantity != null ? String(batch.quantity).replace('.', ',') : '',
      manufactureDate: batch.manufactureDate ?? '',
      expirationDate: batch.expirationDate ?? '',
      notes: batch.notes ?? '',
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
    form.productId !== '' && form.locationId !== '' && form.batchNumber.trim() !== '';

  async function submit(e) {
    e.preventDefault();
    if (!formValid) return;
    setSaving(true);
    setError(null);
    const payload = {
      productId: Number(form.productId),
      locationId: Number(form.locationId),
      batchNumber: form.batchNumber.trim(),
      quantity: form.quantity !== '' ? parseAmount(form.quantity) : null,
      manufactureDate: form.manufactureDate || null,
      expirationDate: form.expirationDate || null,
      notes: form.notes.trim() || null,
    };
    let failed = false;
    try {
      if (editing) {
        await api.put(`/stock-batches/${editing.id}`, payload);
      } else {
        await api.post('/stock-batches', payload);
      }
      await load();
    } catch (err) {
      if (!mocked) {
        failed = true;
        setError(err?.message ?? 'Erro ao salvar lote.');
      } else {
        const product = data.products.find((p) => String(p.id) === form.productId);
        const location = data.storageLocations.find((l) => String(l.id) === form.locationId);
        setData((prev) => {
          if (editing) {
            return {
              ...prev,
              stockBatches: prev.stockBatches.map((b) =>
                b.id === editing.id
                  ? {
                      ...b,
                      ...payload,
                      productName: product?.name ?? b.productName,
                      locationName: location?.name ?? b.locationName,
                      updatedAt: new Date().toISOString(),
                    }
                  : b
              ),
            };
          }
          const id = Math.max(0, ...prev.stockBatches.map((b) => Number(b.id) || 0)) + 1;
          return {
            ...prev,
            stockBatches: [
              ...prev.stockBatches,
              {
                id,
                ...payload,
                productName: product?.name ?? '',
                locationName: location?.name ?? '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
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
      await api.delete(`/stock-batches/${deleting.id}`);
      await load();
    } catch {
      setMocked(true);
      setData((prev) => ({
        ...prev,
        stockBatches: prev.stockBatches.filter((b) => b.id !== deleting.id),
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
          <h1 className="h4 mb-1 fw-semibold">Lotes</h1>
          <p className="mb-0 text-muted small">Controle de lotes e datas de validade</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openNew}>
          <Icon name="plus" size={16} className="me-1" />
          Novo lote
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
              <span className="text-muted small text-uppercase">Lotes</span>
              <div className="fs-5 fw-semibold">{stats.total}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Dentro do prazo</span>
              <div className="fs-5 fw-semibold text-success">{stats.ok}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">A vencer ({WARN_DAYS}d)</span>
              <div className="fs-5 fw-semibold text-warning">{stats.warning}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Vencidos</span>
              <div className={`fs-5 fw-semibold ${stats.expired > 0 ? 'text-danger' : ''}`}>
                {stats.expired}
              </div>
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
              placeholder="Buscar lote ou produto..."
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
            style={{ maxWidth: 200 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todas as validades</option>
            <option value="ok">Dentro do prazo</option>
            <option value="warning">A vencer</option>
            <option value="expired">Vencidos</option>
          </select>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Lote</th>
                <th>Produto</th>
                <th>Local</th>
                <th className="text-end">Quantidade</th>
                <th>Fabricação</th>
                <th>Validade</th>
                <th>Status</th>
                <th className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {batches.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-4">
                    Nenhum lote encontrado.
                  </td>
                </tr>
              ) : (
                batches.map((b) => {
                  const status = expirationStatus(b.expirationDate);
                  const unit = unitOf(b.productId);
                  return (
                    <tr key={b.id}>
                      <td className="fw-semibold">{b.batchNumber}</td>
                      <td className="fw-medium">{b.productName}</td>
                      <td>{b.locationName}</td>
                      <td className="text-end">
                        {b.quantity != null
                          ? `${qtyFmt.format(Number(b.quantity) || 0)}${unit ? ` ${unit}` : ''}`
                          : '—'}
                      </td>
                      <td className="text-muted">
                        {b.manufactureDate ? dateFmt.format(new Date(`${b.manufactureDate}T00:00:00`)) : '—'}
                      </td>
                      <td className="text-muted">
                        {b.expirationDate ? dateFmt.format(new Date(`${b.expirationDate}T00:00:00`)) : '—'}
                      </td>
                      <td>
                        {status ? (
                          <span className={`badge ${status.badge}`}>{status.label}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            title="Editar"
                            onClick={() => openEdit(b)}
                          >
                            <Icon name="edit" size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            title="Excluir"
                            onClick={() => setDeleting(b)}
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
          title={editing ? `Editar lote ${editing.batchNumber}` : 'Novo lote'}
          icon="layers"
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
                form="batch-form"
                className="btn btn-primary"
                disabled={saving || !formValid}
              >
                {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar'}
              </button>
            </>
          }
        >
          <form id="batch-form" onSubmit={submit}>
            {error && (
              <div className="alert alert-danger py-2 small" role="alert">
                {error}
              </div>
            )}
            <div className="row g-3">
              <div className="col-md-6">
                <label htmlFor="l-product" className="form-label">
                  Produto *
                </label>
                <select
                  id="l-product"
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
              <div className="col-md-6">
                <label htmlFor="l-location" className="form-label">
                  Local *
                </label>
                <select
                  id="l-location"
                  className="form-select"
                  value={form.locationId}
                  onChange={(e) => setForm((f) => ({ ...f, locationId: e.target.value }))}
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
                <label htmlFor="l-number" className="form-label">
                  Número do lote *
                </label>
                <input
                  id="l-number"
                  type="text"
                  className="form-control"
                  placeholder="Ex.: LT-2026-01"
                  value={form.batchNumber}
                  onChange={(e) => setForm((f) => ({ ...f, batchNumber: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="l-quantity" className="form-label">
                  Quantidade
                </label>
                <div className="input-group">
                  <input
                    id="l-quantity"
                    type="text"
                    inputMode="decimal"
                    className="form-control"
                    placeholder="0"
                    value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                  />
                  {form.productId && unitOf(form.productId) && (
                    <span className="input-group-text">{unitOf(form.productId)}</span>
                  )}
                </div>
              </div>
              <div className="col-md-6">
                <label htmlFor="l-manufacture" className="form-label">
                  Data de fabricação
                </label>
                <input
                  id="l-manufacture"
                  type="date"
                  className="form-control"
                  value={form.manufactureDate}
                  onChange={(e) => setForm((f) => ({ ...f, manufactureDate: e.target.value }))}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="l-expiration" className="form-label">
                  Data de validade
                </label>
                <input
                  id="l-expiration"
                  type="date"
                  className="form-control"
                  value={form.expirationDate}
                  onChange={(e) => setForm((f) => ({ ...f, expirationDate: e.target.value }))}
                />
              </div>
              <div className="col-12">
                <label htmlFor="l-notes" className="form-label">
                  Observações
                </label>
                <textarea
                  id="l-notes"
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

      {deleting && (
        <Modal
          title="Excluir lote"
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
            Excluir o lote <strong>{deleting.batchNumber}</strong> de{' '}
            <strong>{deleting.productName}</strong>? Esta ação não pode ser desfeita.
          </p>
        </Modal>
      )}
    </div>
  );
}
