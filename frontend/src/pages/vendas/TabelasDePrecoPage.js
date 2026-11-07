import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { buildTabelasMock } from '../../mocks/tabelasMock';
import Icon from '../../components/Icons/Icons';
import Modal from '../../components/Modal/Modal';
import styles from '../../styles/bsTheme.module.css';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const parseAmount = (value) => Number(String(value).replace(',', '.')) || 0;

const EMPTY_FORM = { name: '', description: '', active: true, items: [] };

export default function TabelasDePrecoPage() {
  const [data, setData] = useState(null);
  const [mocked, setMocked] = useState(false);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(() => new Set());

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const mock = buildTabelasMock();
    const [tablesRes, productsRes] = await Promise.allSettled([
      api.get('/price-tables'),
      api.get('/products'),
    ]);
    const priceTables =
      tablesRes.status === 'fulfilled' && Array.isArray(tablesRes.value)
        ? tablesRes.value
        : mock.priceTables;
    const products =
      productsRes.status === 'fulfilled' && Array.isArray(productsRes.value)
        ? productsRes.value
        : mock.products;
    setMocked(tablesRes.status !== 'fulfilled' || productsRes.status !== 'fulfilled');
    setData({ priceTables, products });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const tables = useMemo(() => {
    const list = [...(data?.priceTables ?? [])].sort((a, b) =>
      (a.name ?? '').localeCompare(b.name ?? '', 'pt-BR')
    );
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter(
      (t) =>
        (t.name ?? '').toLowerCase().includes(term) ||
        (t.description ?? '').toLowerCase().includes(term)
    );
  }, [data, search]);

  const stats = useMemo(() => {
    const list = data?.priceTables ?? [];
    const active = list.filter((t) => t.active !== false).length;
    const items = list.reduce((sum, t) => sum + (t.items ?? []).length, 0);
    return { total: list.length, active, items };
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

  function openEdit(table) {
    setEditing(table);
    setForm({
      name: table.name ?? '',
      description: table.description ?? '',
      active: table.active !== false,
      items: (table.items ?? []).map((i) => ({
        productId: String(i.productId),
        price: Number(i.price ?? 0).toFixed(2).replace('.', ','),
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
    setForm((f) => ({ ...f, items: [...f.items, { productId: '', price: '' }] }));
  }

  function removeItem(index) {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
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
    form.name.trim() !== '' &&
    form.items.every((i) => i.productId !== '' && parseAmount(i.price) >= 0);

  async function submit(e) {
    e.preventDefault();
    if (!formValid) return;
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      active: form.active,
      items: form.items.map((i) => ({
        productId: Number(i.productId),
        price: parseAmount(i.price),
      })),
    };
    let failed = false;
    try {
      if (editing) {
        await api.put(`/price-tables/${editing.id}`, payload);
      } else {
        await api.post('/price-tables', payload);
      }
      await load();
    } catch (err) {
      if (!mocked) {
        failed = true;
        setError(err?.message ?? 'Erro ao salvar tabela de preço.');
      } else {
        const productName = (id) =>
          data.products.find((p) => String(p.id) === String(id))?.name ?? '';
        setData((prev) => {
          const items = payload.items.map((i, idx) => ({
            id: Date.now() + idx,
            productId: i.productId,
            productName: productName(i.productId),
            price: i.price,
          }));
          if (editing) {
            return {
              ...prev,
              priceTables: prev.priceTables.map((t) =>
                t.id === editing.id ? { ...t, ...payload, items } : t
              ),
            };
          }
          const id = Math.max(0, ...prev.priceTables.map((t) => Number(t.id) || 0)) + 1;
          return {
            ...prev,
            priceTables: [
              ...prev.priceTables,
              { id, createdAt: new Date().toISOString(), ...payload, items },
            ],
          };
        });
      }
    } finally {
      setSaving(false);
      if (!failed) closeModal();
    }
  }

  async function toggleActive(table) {
    const next = !(table.active !== false);
    const payload = {
      name: table.name,
      description: table.description,
      active: next,
      items: (table.items ?? []).map((i) => ({ productId: i.productId, price: i.price })),
    };
    try {
      await api.put(`/price-tables/${table.id}`, payload);
      await load();
    } catch {
      setMocked(true);
      setData((prev) => ({
        ...prev,
        priceTables: prev.priceTables.map((t) =>
          t.id === table.id ? { ...t, active: next } : t
        ),
      }));
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
          <h1 className="h4 mb-1 fw-semibold">Tabelas de preço</h1>
          <p className="mb-0 text-muted small">Tabelas de preço e preços por produto</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openNew}>
          <Icon name="plus" size={16} className="me-1" />
          Nova tabela
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
              <span className="text-muted small text-uppercase">Tabelas</span>
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
              <span className="text-muted small text-uppercase">Preços cadastrados</span>
              <div className="fs-5 fw-semibold">{stats.items}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="input-group input-group-sm" style={{ maxWidth: 380 }}>
            <span className="input-group-text">
              <Icon name="search" size={14} />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar tabela..."
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
                <th>Tabela</th>
                <th>Produtos</th>
                <th>Status</th>
                <th className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {tables.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">
                    {search ? 'Nenhuma tabela encontrada.' : 'Nenhuma tabela cadastrada.'}
                  </td>
                </tr>
              ) : (
                tables.map((t) => (
                  <TableRows
                    key={t.id}
                    table={t}
                    expanded={expanded.has(t.id)}
                    onToggle={() => toggleExpand(t.id)}
                    onEdit={() => openEdit(t)}
                    onToggleActive={() => toggleActive(t)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <Modal
          title={editing ? `Editar tabela #${editing.id}` : 'Nova tabela de preço'}
          icon="tag"
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
                form="price-table-form"
                className="btn btn-primary"
                disabled={saving || !formValid}
              >
                {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar'}
              </button>
            </>
          }
        >
          <form id="price-table-form" onSubmit={submit}>
            {error && (
              <div className="alert alert-danger py-2 small" role="alert">
                {error}
              </div>
            )}
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label htmlFor="t-name" className="form-label">
                  Nome *
                </label>
                <input
                  id="t-name"
                  type="text"
                  className="form-control"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  autoFocus
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="t-description" className="form-label">
                  Descrição
                </label>
                <input
                  id="t-description"
                  type="text"
                  className="form-control"
                  maxLength="1000"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-between mb-2">
              <h6 className="text-muted text-uppercase small fw-semibold mb-0">
                Preços por produto
              </h6>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={addItem}
              >
                <Icon name="plus" size={14} className="me-1" />
                Adicionar produto
              </button>
            </div>

            {form.items.length === 0 ? (
              <p className="text-muted small text-center border rounded py-3 mb-3">
                Nenhum produto nesta tabela — clique em "Adicionar produto".
              </p>
            ) : (
              <div className="table-responsive border rounded mb-3">
                <table className="table table-sm align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th style={{ width: 160 }}>Preço</th>
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
                            <span className="input-group-text">R$</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              className="form-control"
                              placeholder="0,00"
                              value={item.price}
                              onChange={(e) => setItem(index, { price: e.target.value })}
                              required
                            />
                          </div>
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
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="form-check form-switch">
              <input
                id="t-active"
                type="checkbox"
                className="form-check-input"
                role="switch"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              />
              <label htmlFor="t-active" className="form-check-label">
                Tabela ativa
              </label>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function TableRows({ table, expanded, onToggle, onEdit, onToggleActive }) {
  const items = table.items ?? [];
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
        <td className="fw-semibold">#{table.id}</td>
        <td>
          <div className="fw-medium">{table.name}</div>
          {table.description && <div className="text-muted small">{table.description}</div>}
        </td>
        <td>{items.length}</td>
        <td>
          <span
            className={`badge ${table.active !== false ? 'text-bg-success' : 'text-bg-secondary'}`}
          >
            {table.active !== false ? 'Ativa' : 'Inativa'}
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
              className={`btn ${table.active !== false ? 'btn-outline-danger' : 'btn-outline-success'}`}
              title={table.active !== false ? 'Desativar' : 'Reativar'}
              onClick={onToggleActive}
            >
              <Icon name={table.active !== false ? 'x' : 'check'} size={14} />
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan="6" className="p-0">
            <div className="px-4 py-2 border-start border-3" style={{ borderColor: 'var(--color-primary-soft)' }}>
              {items.length === 0 ? (
                <span className="text-muted small">Nenhum preço cadastrado nesta tabela.</span>
              ) : (
                <table className="table table-sm mb-0" style={{ maxWidth: 520 }}>
                  <tbody>
                    {items.map((i) => (
                      <tr key={i.id}>
                        <td className="border-0 ps-0">{i.productName}</td>
                        <td className="border-0 text-end fw-semibold">
                          {currency.format(Number(i.price) || 0)}
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
