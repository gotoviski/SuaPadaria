import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { buildCaixaMock } from '../../mocks/caixaMock';
import Icon from '../../components/Icons/Icons';
import styles from './CaixaPage.module.css';

const ENDPOINTS = {
  cashRegisters: '/cash-registers',
  employees: '/employees',
};

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const dateTimeFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
const clockFmt = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });

const toNumber = (value) => Number(value) || 0;
const parseAmount = (value) => Number(String(value).replace(',', '.')) || 0;

function Modal({ title, icon, onClose, children, footer, wide }) {
  return (
    <>
      <div className="modal-backdrop fade show" onClick={onClose} />
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
        onClick={onClose}
      >
        <div
          className={`modal-dialog modal-dialog-centered ${wide ? 'modal-lg' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title d-flex align-items-center gap-2">
                <Icon name={icon} size={18} />
                {title}
              </h5>
              <button type="button" className="btn-close" aria-label="Fechar" onClick={onClose} />
            </div>
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-footer">{footer}</div>}
          </div>
        </div>
      </div>
    </>
  );
}

export default function CaixaPage() {
  const [data, setData] = useState(null);
  const [mocked, setMocked] = useState(false);
  const [now, setNow] = useState(new Date());

  const [openModal, setOpenModal] = useState(false);
  const [movementModal, setMovementModal] = useState(null);
  const [closeModal, setCloseModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [openForm, setOpenForm] = useState({ employeeId: '', openingAmount: '', notes: '' });
  const [movementForm, setMovementForm] = useState({ amount: '', description: '' });
  const [closeForm, setCloseForm] = useState({ closingAmount: '', notes: '' });

  const load = useCallback(async () => {
    const mock = buildCaixaMock();
    const [registersRes, employeesRes] = await Promise.allSettled([
      api.get(ENDPOINTS.cashRegisters),
      api.get(ENDPOINTS.employees),
    ]);
    const cashRegisters =
      registersRes.status === 'fulfilled' && Array.isArray(registersRes.value)
        ? registersRes.value
        : mock.cashRegisters;
    const employees =
      employeesRes.status === 'fulfilled' && Array.isArray(employeesRes.value)
        ? employeesRes.value
        : mock.employees;

    const current = cashRegisters.find((r) => r.status === 'OPEN');
    let movements = mock.cashMovements;
    if (current) {
      try {
        const list = await api.get(`/cash-movements?cashRegisterId=${current.id}`);
        if (Array.isArray(list)) movements = list;
      } catch {
        movements = mock.cashMovements;
      }
    }

    setMocked(
      registersRes.status !== 'fulfilled' || employeesRes.status !== 'fulfilled'
    );
    setData({ cashRegisters, employees, cashMovements: movements });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const openRegister = useMemo(
    () => (data?.cashRegisters ?? []).find((r) => r.status === 'OPEN') ?? null,
    [data]
  );

  const movements = useMemo(() => {
    if (!openRegister) return [];
    return (data?.cashMovements ?? [])
      .filter((m) => String(m.cashRegisterId) === String(openRegister.id))
      .sort((a, b) => new Date(b.movementDate) - new Date(a.movementDate));
  }, [data, openRegister]);

  const totals = useMemo(() => {
    const opening = toNumber(openRegister?.openingAmount);
    const entries = movements
      .filter((m) => m.type === 'ENTRY')
      .reduce((sum, m) => sum + toNumber(m.amount), 0);
    const exits = movements
      .filter((m) => m.type === 'EXIT')
      .reduce((sum, m) => sum + toNumber(m.amount), 0);
    return { opening, entries, exits, balance: opening + entries - exits };
  }, [openRegister, movements]);

  const history = useMemo(
    () =>
      [...(data?.cashRegisters ?? [])].sort(
        (a, b) => new Date(b.openedAt) - new Date(a.openedAt)
      ),
    [data]
  );

  async function submitOpen(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      employeeId: openForm.employeeId ? Number(openForm.employeeId) : null,
      openedAt: new Date().toISOString(),
      openingAmount: parseAmount(openForm.openingAmount),
      notes: openForm.notes || null,
    };
    try {
      await api.post(ENDPOINTS.cashRegisters, payload);
    } catch {
      setMocked(true);
      const employee = data.employees.find((emp) => String(emp.id) === openForm.employeeId);
      setData((prev) => ({
        ...prev,
        cashRegisters: [
          {
            id: Math.max(0, ...prev.cashRegisters.map((r) => toNumber(r.id))) + 1,
            employeeId: payload.employeeId,
            employeeName: employee?.name ?? 'Operador',
            openedAt: payload.openedAt,
            closedAt: null,
            openingAmount: payload.openingAmount,
            closingAmount: null,
            status: 'OPEN',
            notes: payload.notes,
          },
          ...prev.cashRegisters,
        ],
        cashMovements: [],
      }));
    } finally {
      setSaving(false);
      setOpenModal(false);
      setOpenForm({ employeeId: '', openingAmount: '', notes: '' });
      load();
    }
  }

  async function submitMovement(e) {
    e.preventDefault();
    if (!movementModal || !openRegister) return;
    setSaving(true);
    setError(null);
    const payload = {
      cashRegisterId: openRegister.id,
      type: movementModal,
      amount: parseAmount(movementForm.amount),
      description: movementForm.description || null,
      movementDate: new Date().toISOString(),
    };
    try {
      await api.post('/cash-movements', payload);
    } catch {
      setMocked(true);
      setData((prev) => ({
        ...prev,
        cashMovements: [
          {
            id: Math.max(0, ...prev.cashMovements.map((m) => toNumber(m.id))) + 1,
            ...payload,
          },
          ...prev.cashMovements,
        ],
      }));
    } finally {
      setSaving(false);
      setMovementModal(null);
      setMovementForm({ amount: '', description: '' });
      load();
    }
  }

  async function submitClose(e) {
    e.preventDefault();
    if (!openRegister) return;
    setSaving(true);
    setError(null);
    const payload = {
      employeeId: openRegister.employeeId,
      openedAt: openRegister.openedAt,
      openingAmount: toNumber(openRegister.openingAmount),
      closedAt: new Date().toISOString(),
      closingAmount: parseAmount(closeForm.closingAmount),
      notes: closeForm.notes || openRegister.notes || null,
    };
    try {
      await api.put(`${ENDPOINTS.cashRegisters}/${openRegister.id}`, payload);
    } catch {
      setMocked(true);
      setData((prev) => ({
        ...prev,
        cashRegisters: prev.cashRegisters.map((r) =>
          r.id === openRegister.id
            ? {
                ...r,
                closedAt: payload.closedAt,
                closingAmount: payload.closingAmount,
                notes: payload.notes,
                status: 'CLOSED',
              }
            : r
        ),
      }));
    } finally {
      setSaving(false);
      setCloseModal(false);
      setCloseForm({ closingAmount: '', notes: '' });
      load();
    }
  }

  function openCloseModal() {
    setCloseForm({ closingAmount: totals.balance.toFixed(2).replace('.', ','), notes: '' });
    setCloseModal(true);
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
    <div className={styles.caixa}>
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <div>
          <h1 className="h4 mb-1 fw-semibold">Caixa</h1>
          <p className="mb-0 text-muted small">
            {openRegister
              ? `Caixa #${openRegister.id} aberto por ${openRegister.employeeName ?? 'Operador'} · ${dateTimeFmt.format(new Date(openRegister.openedAt))}`
              : 'Nenhum caixa aberto no momento'}
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className={`badge rounded-pill ${openRegister ? 'text-bg-success' : 'text-bg-secondary'}`}>
            {openRegister ? 'Aberto' : 'Fechado'}
          </span>
          <span className={`${styles.clock} badge text-bg-light border`}>
            {clockFmt.format(now)}
          </span>
        </div>
      </div>

      {mocked && (
        <div className="alert alert-warning py-2 small" role="alert">
          API indisponível — exibindo dados de exemplo. As alterações são apenas locais.
        </div>
      )}
      {error && (
        <div className="alert alert-danger py-2 small" role="alert">
          {error}
        </div>
      )}

      {openRegister ? (
        <>
          <div className="row g-3 mb-3">
            <div className="col-6 col-lg-3">
              <div className={`card h-100 ${styles.statCard}`}>
                <div className="card-body">
                  <span className="text-muted small text-uppercase">Fundo de caixa</span>
                  <div className="fs-5 fw-semibold">{currency.format(totals.opening)}</div>
                </div>
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <div className={`card h-100 ${styles.statCard}`}>
                <div className="card-body">
                  <span className="text-muted small text-uppercase">Entradas</span>
                  <div className="fs-5 fw-semibold text-success">
                    + {currency.format(totals.entries)}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <div className={`card h-100 ${styles.statCard}`}>
                <div className="card-body">
                  <span className="text-muted small text-uppercase">Saídas</span>
                  <div className="fs-5 fw-semibold text-danger">
                    − {currency.format(totals.exits)}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <div className={`card h-100 ${styles.statCard} ${styles.statBalance}`}>
                <div className="card-body">
                  <span className="small text-uppercase">Saldo em caixa</span>
                  <div className="fs-5 fw-bold">{currency.format(totals.balance)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card mb-3">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
              <span className="fw-semibold">Movimentações do caixa</span>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-success"
                  onClick={() => setMovementModal('ENTRY')}
                >
                  <Icon name="arrow-down-circle" size={14} className="me-1" />
                  Suprimento
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => setMovementModal('EXIT')}
                >
                  <Icon name="arrow-up-circle" size={14} className="me-1" />
                  Sangria
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={openCloseModal}
                >
                  <Icon name="check" size={14} className="me-1" />
                  Fechar caixa
                </button>
              </div>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Tipo</th>
                    <th>Descrição</th>
                    <th className="text-end">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center text-muted py-4">
                        Nenhuma movimentação registrada neste caixa.
                      </td>
                    </tr>
                  ) : (
                    movements.map((m) => (
                      <tr key={m.id}>
                        <td className="text-nowrap">
                          {m.movementDate ? dateTimeFmt.format(new Date(m.movementDate)) : '—'}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              m.type === 'ENTRY' ? 'text-bg-success' : 'text-bg-danger'
                            }`}
                          >
                            {m.type === 'ENTRY' ? 'Entrada' : 'Saída'}
                          </span>
                        </td>
                        <td>{m.description || '—'}</td>
                        <td
                          className={`text-end fw-semibold ${
                            m.type === 'ENTRY' ? 'text-success' : 'text-danger'
                          }`}
                        >
                          {m.type === 'ENTRY' ? '+' : '−'} {currency.format(toNumber(m.amount))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="card mb-3">
          <div className="card-body text-center py-5">
            <Icon name="cash" size={40} className="text-muted mb-3" />
            <h2 className="h5 fw-semibold">Nenhum caixa aberto</h2>
            <p className="text-muted small mb-4">
              Abra o caixa para registrar suprimentos, sangrias e acompanhar o saldo do dia.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setOpenModal(true)}
            >
              <Icon name="plus" size={16} className="me-1" />
              Abrir caixa
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <span className="fw-semibold">Histórico de caixas</span>
          <span className="text-muted small">{history.length} registros</span>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Nº</th>
                <th>Operador</th>
                <th>Abertura</th>
                <th>Fechamento</th>
                <th className="text-end">Fundo</th>
                <th className="text-end">Valor final</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-4">
                    Nenhum caixa registrado.
                  </td>
                </tr>
              ) : (
                history.map((r) => (
                  <tr key={r.id}>
                    <td className="fw-semibold">#{r.id}</td>
                    <td>{r.employeeName || '—'}</td>
                    <td className="text-nowrap">
                      {r.openedAt ? dateTimeFmt.format(new Date(r.openedAt)) : '—'}
                    </td>
                    <td className="text-nowrap">
                      {r.closedAt ? dateTimeFmt.format(new Date(r.closedAt)) : '—'}
                    </td>
                    <td className="text-end">{currency.format(toNumber(r.openingAmount))}</td>
                    <td className="text-end">
                      {r.closingAmount != null ? currency.format(toNumber(r.closingAmount)) : '—'}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          r.status === 'OPEN' ? 'text-bg-success' : 'text-bg-secondary'
                        }`}
                      >
                        {r.status === 'OPEN' ? 'Aberto' : 'Fechado'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {openModal && (
        <Modal
          title="Abrir caixa"
          icon="cash"
          onClose={() => !saving && setOpenModal(false)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setOpenModal(false)}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="caixa-open-form"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? 'Abrindo...' : 'Abrir caixa'}
              </button>
            </>
          }
        >
          <form id="caixa-open-form" onSubmit={submitOpen}>
            <div className="mb-3">
              <label htmlFor="open-employee" className="form-label">
                Operador
              </label>
              <select
                id="open-employee"
                className="form-select"
                value={openForm.employeeId}
                onChange={(e) => setOpenForm((f) => ({ ...f, employeeId: e.target.value }))}
                required
              >
                <option value="">Selecione...</option>
                {data.employees
                  .filter((emp) => emp.active !== false)
                  .map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="mb-3">
              <label htmlFor="open-amount" className="form-label">
                Fundo de caixa (valor inicial)
              </label>
              <div className="input-group">
                <span className="input-group-text">R$</span>
                <input
                  id="open-amount"
                  type="text"
                  inputMode="decimal"
                  className="form-control"
                  placeholder="0,00"
                  value={openForm.openingAmount}
                  onChange={(e) =>
                    setOpenForm((f) => ({ ...f, openingAmount: e.target.value }))
                  }
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="open-notes" className="form-label">
                Observações
              </label>
              <textarea
                id="open-notes"
                className="form-control"
                rows="2"
                maxLength="1000"
                placeholder="Opcional"
                value={openForm.notes}
                onChange={(e) => setOpenForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </form>
        </Modal>
      )}

      {movementModal && (
        <Modal
          title={movementModal === 'ENTRY' ? 'Novo suprimento' : 'Nova sangria'}
          icon={movementModal === 'ENTRY' ? 'arrow-down-circle' : 'arrow-up-circle'}
          onClose={() => !saving && setMovementModal(null)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setMovementModal(null)}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="caixa-movement-form"
                className={`btn ${movementModal === 'ENTRY' ? 'btn-success' : 'btn-danger'}`}
                disabled={saving || parseAmount(movementForm.amount) <= 0}
              >
                {saving ? 'Salvando...' : 'Confirmar'}
              </button>
            </>
          }
        >
          <form id="caixa-movement-form" onSubmit={submitMovement}>
            <div className="mb-3">
              <label htmlFor="movement-amount" className="form-label">
                Valor
              </label>
              <div className="input-group">
                <span className="input-group-text">R$</span>
                <input
                  id="movement-amount"
                  type="text"
                  inputMode="decimal"
                  className="form-control"
                  placeholder="0,00"
                  value={movementForm.amount}
                  onChange={(e) =>
                    setMovementForm((f) => ({ ...f, amount: e.target.value }))
                  }
                  autoFocus
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="movement-description" className="form-label">
                Descrição
              </label>
              <input
                id="movement-description"
                type="text"
                className="form-control"
                maxLength="500"
                placeholder={
                  movementModal === 'ENTRY'
                    ? 'Ex.: suprimento para troco'
                    : 'Ex.: sangria para o cofre'
                }
                value={movementForm.description}
                onChange={(e) =>
                  setMovementForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
          </form>
        </Modal>
      )}

      {closeModal && (
        <Modal
          title="Fechar caixa"
          icon="check"
          onClose={() => !saving && setCloseModal(false)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setCloseModal(false)}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="caixa-close-form"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? 'Fechando...' : 'Confirmar fechamento'}
              </button>
            </>
          }
        >
          <div className={`${styles.closeSummary} rounded p-3 mb-3`}>
            <div className="d-flex justify-content-between small">
              <span className="text-muted">Fundo de caixa</span>
              <span>{currency.format(totals.opening)}</span>
            </div>
            <div className="d-flex justify-content-between small">
              <span className="text-muted">Entradas</span>
              <span className="text-success">+ {currency.format(totals.entries)}</span>
            </div>
            <div className="d-flex justify-content-between small">
              <span className="text-muted">Saídas</span>
              <span className="text-danger">− {currency.format(totals.exits)}</span>
            </div>
            <hr className="my-2" />
            <div className="d-flex justify-content-between fw-semibold">
              <span>Saldo esperado</span>
              <span>{currency.format(totals.balance)}</span>
            </div>
          </div>
          <form id="caixa-close-form" onSubmit={submitClose}>
            <div className="mb-3">
              <label htmlFor="close-amount" className="form-label">
                Valor contado em caixa
              </label>
              <div className="input-group">
                <span className="input-group-text">R$</span>
                <input
                  id="close-amount"
                  type="text"
                  inputMode="decimal"
                  className="form-control"
                  placeholder="0,00"
                  value={closeForm.closingAmount}
                  onChange={(e) =>
                    setCloseForm((f) => ({ ...f, closingAmount: e.target.value }))
                  }
                  autoFocus
                  required
                />
              </div>
              {closeForm.closingAmount !== '' && (
                <div
                  className={`form-text ${
                    parseAmount(closeForm.closingAmount) === totals.balance
                      ? 'text-success'
                      : 'text-warning'
                  }`}
                >
                  {(() => {
                    const diff = parseAmount(closeForm.closingAmount) - totals.balance;
                    if (diff === 0) return 'Conferência exata — sem diferença.';
                    return diff > 0
                      ? `Sobra de ${currency.format(diff)} em relação ao esperado.`
                      : `Quebra de ${currency.format(Math.abs(diff))} em relação ao esperado.`;
                  })()}
                </div>
              )}
            </div>
            <div>
              <label htmlFor="close-notes" className="form-label">
                Observações
              </label>
              <textarea
                id="close-notes"
                className="form-control"
                rows="2"
                maxLength="1000"
                placeholder="Opcional"
                value={closeForm.notes}
                onChange={(e) => setCloseForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
