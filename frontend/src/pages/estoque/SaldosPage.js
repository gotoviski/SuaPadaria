import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { buildEstoqueMock } from '../../mocks/estoqueMock';
import Icon from '../../components/Icons/Icons';
import Modal from '../../components/Modal/Modal';
import styles from '../../styles/bsTheme.module.css';

const qtyFmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 });
const dateFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const parseAmount = (value) => Number(String(value).replace(',', '.')) || 0;

const EMPTY_FORM = { productId: '', locationId: '', quantity: '' };

export default function SaldosPage() {
  const [data, setData] = useState(null);
  const [mocked, setMocked] = useState(false);
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const mock = buildEstoqueMock();
    const [balancesRes, locationsRes, productsRes] = await Promise.allSettled([
      api.get('/stock-balances'),
      api.get('/storage-locations'),
      api.get('/products'),
    ]);
    const stockBalances =
      balancesRes.status === 'fulfilled' && Array.isArray(balancesRes.value)
        ? balancesRes.value
        : mock.stockBalances;
    const storageLocations =
      locationsRes.status === 'fulfilled' && Array.isArray(locationsRes.value)
        ? locationsRes.value
        : mock.storageLocations;
    const products =
      productsRes.status === 'fulfilled' && Array.isArray(productsRes.value)
        ? productsRes.value
        : mock.products;
    setMocked(
      [balancesRes, locationsRes, productsRes].some((r) => r.status !== 'fulfilled')
    );
    setData({ stockBalances, storageLocations, products });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const unitOf = useCallback(
    (productId) =>
      (data?.products ?? []).find((p) => String(p.id) === String(productId))?.unit ?? '',
    [data]
  );

  const balances = useMemo(() => {
    let list = [...(data?.stockBalances ?? [])].sort((a, b) =>
      (a.productName ?? '').localeCompare(b.productName ?? '', 'pt-BR')
    );
    if (locationFilter) {
      list = list.filter((b) => String(b.locationId) === locationFilter);
    }
    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (b) =>
          (b.productName ?? '').toLowerCase().includes(term) ||
          (b.locationName ?? '').toLowerCase().includes(term)
      );
    }
    return list;
  }, [data, search, locationFilter]);

  const stats = useMemo(() => {
    const list = data?.stockBalances ?? [];
    return {
      records: list.length,
      products: new Set(list.map((b) => b.productId)).size,
      locations: new Set(list.map((b) => b.locationId)).size,
      empty: list.filter((b) => Number(b.quantity) <= 0).length,
    };
  }, [data]);

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(balance) {
    setEditing(balance);
    setForm({
      productId: String(balance.productId),
      locationId: String(balance.locationId),
      quantity: Number(balance.quantity ?? 0).toString().replace('.', ','),
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
    form.productId !== '' && form.locationId !== '' && parseAmount(form.quantity) >= 0;

  async function submit(e) {
    e.preventDefault();
    if (!formValid) return;
    setSaving(true);
    setError(null);
    const payload = {
      productId: Number(form.productId),
      locationId: Number(form.locationId),
      quantity: parseAmount(form.quantity),
    };
    let failed = false;
    try {
      if (editing) {
        await api.put(`/stock-balances/${editing.id}`, payload);
      } else {
        await api.post('/stock-balances', payload);
      }
      await load();
    } catch (err) {
      if (!mocked) {
        failed = true;
        setError(err?.message ?? 'Erro ao salvar saldo.');
      } else {
        const product = data.products.find((p) => String(p.id) === form.productId);
        const location = data.storageLocations.find((l) => String(l.id) === form.locationId);
        setData((prev) => {
          if (editing) {
            return {
              ...prev,
              stockBalances: prev.stockBalances.map((b) =>
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
          const id = Math.max(0, ...prev.stockBalances.map((b) => Number(b.id) || 0)) + 1;
          return {
            ...prev,
            stockBalances: [
              ...prev.stockBalances,
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
      await api.delete(`/stock-balances/${deleting.id}`);
      await load();
    } catch {
      setMocked(true);
      setData((prev) => ({
        ...prev,
        stockBalances: prev.stockBalances.filter((b) => b.id !== deleting.id),
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
          <h1 className="h4 mb-1 fw-semibold">Saldos de estoque</h1>
          <p className="mb-0 text-muted small">Quantidade em estoque por produto e local</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openNew}>
          <Icon name="plus" size={16} className="me-1" />
          Novo saldo
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
              <div className="fs-5 fw-semibold">{stats.records}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Produtos</span>
              <div className="fs-5 fw-semibold">{stats.products}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Locais</span>
              <div className="fs-5 fw-semibold">{stats.locations}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className={`card h-100 ${styles.statCard}`}>
            <div className="card-body">
              <span className="text-muted small text-uppercase">Itens zerados</span>
              <div className={`fs-5 fw-semibold ${stats.empty > 0 ? 'text-danger' : 'text-success'}`}>
                {stats.empty}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex align-items-center gap-2 flex-wrap">
          <div className="input-group input-group-sm" style={{ maxWidth: 340 }}>
            <span className="input-group-text">
              <Icon name="search" size={14} />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar produto ou local..."
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
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Local</th>
                <th className="text-end">Quantidade</th>
                <th>Atualizado</th>
                <th className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {balances.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-4">
                    {search || locationFilter
                      ? 'Nenhum saldo encontrado.'
                      : 'Nenhum saldo registrado.'}
                  </td>
                </tr>
              ) : (
                balances.map((b) => {
                  const qty = Number(b.quantity) || 0;
                  const unit = unitOf(b.productId);
                  return (
                    <tr key={b.id}>
                      <td className="fw-medium">{b.productName}</td>
                      <td>{b.locationName}</td>
                      <td className="text-end">
                        <span
                          className={`badge ${
                            qty <= 0 ? 'text-bg-danger' : 'text-bg-success'
                          }`}
                        >
                          {qtyFmt.format(qty)}
                          {unit ? ` ${unit}` : ''}
                        </span>
                      </td>
                      <td className="text-muted">
                        {b.updatedAt ? dateFmt.format(new Date(b.updatedAt)) : '—'}
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
          title={editing ? `Editar saldo #${editing.id}` : 'Novo saldo'}
          icon="package"
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
                form="balance-form"
                className="btn btn-primary"
                disabled={saving || !formValid}
              >
                {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar'}
              </button>
            </>
          }
        >
          <form id="balance-form" onSubmit={submit}>
            {error && (
              <div className="alert alert-danger py-2 small" role="alert">
                {error}
              </div>
            )}
            <div className="mb-3">
              <label htmlFor="b-product" className="form-label">
                Produto *
              </label>
              <select
                id="b-product"
                className="form-select"
                value={form.productId}
                onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}
                disabled={!!editing}
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
            <div className="mb-3">
              <label htmlFor="b-location" className="form-label">
                Local de armazenamento *
              </label>
              <select
                id="b-location"
                className="form-select"
                value={form.locationId}
                onChange={(e) => setForm((f) => ({ ...f, locationId: e.target.value }))}
                disabled={!!editing}
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
            <div>
              <label htmlFor="b-quantity" className="form-label">
                Quantidade *
              </label>
              <div className="input-group">
                <input
                  id="b-quantity"
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
          title="Excluir saldo"
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
            Excluir o saldo de <strong>{deleting.productName}</strong> em{' '}
            <strong>{deleting.locationName}</strong>? Esta ação não pode ser desfeita.
          </p>
        </Modal>
      )}
    </div>
  );
}
