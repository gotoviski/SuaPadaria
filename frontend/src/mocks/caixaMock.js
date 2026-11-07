function isoAt(offsetDays, hour, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function register(id, employeeId, employeeName, openedAt, closedAt, openingAmount, closingAmount, notes) {
  return {
    id,
    employeeId,
    employeeName,
    openedAt,
    closedAt,
    openingAmount,
    closingAmount,
    status: closedAt ? 'CLOSED' : 'OPEN',
    notes: notes ?? null,
  };
}

function movement(id, cashRegisterId, type, amount, description, movementDate) {
  return { id, cashRegisterId, type, amount, description, movementDate };
}

export function buildCaixaMock() {
  return {
    cashRegisters: [
      register(12, 1, 'Ana Souza', isoAt(0, 7, 0), null, 150.0, null, 'Turno da manhã'),
      register(11, 2, 'Carlos Lima', isoAt(-1, 7, 5), isoAt(-1, 18, 30), 150.0, 843.5, null),
      register(10, 1, 'Ana Souza', isoAt(-2, 6, 55), isoAt(-2, 18, 15), 200.0, 1012.9, 'Fechamento conferido'),
      register(9, 2, 'Carlos Lima', isoAt(-3, 7, 10), isoAt(-3, 18, 0), 150.0, 655.2, null),
      register(8, 1, 'Ana Souza', isoAt(-4, 7, 0), isoAt(-4, 17, 45), 150.0, 720.75, null),
    ],

    cashMovements: [
      movement(34, 12, 'ENTRY', 50.0, 'Suprimento para troco', isoAt(0, 9, 15)),
      movement(33, 12, 'EXIT', 80.0, 'Sangria — depósito no cofre', isoAt(0, 11, 40)),
      movement(32, 12, 'ENTRY', 25.0, 'Pagamento de encomenda', isoAt(0, 13, 5)),
    ],

    employees: [
      { id: 1, name: 'Ana Souza', active: true },
      { id: 2, name: 'Carlos Lima', active: true },
    ],
  };
}
