function isoAt(offsetDays, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function day(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function payable(id, supplierId, supplierName, description, category, amount, dueDate, paidDate, status, paymentMethod, financialAccountId, financialAccountName, notes) {
  return {
    id,
    supplierId,
    supplierName,
    description,
    category,
    amount,
    dueDate,
    paidDate,
    status,
    paymentMethod,
    financialAccountId,
    financialAccountName,
    notes: notes ?? null,
    overdue: status === 'PENDING' && dueDate < day(0),
    createdAt: isoAt(-10),
    updatedAt: isoAt(-1),
  };
}

function receivable(id, customerId, customerName, description, amount, dueDate, receivedDate, status, paymentMethod, financialAccountId, financialAccountName, notes) {
  return {
    id,
    customerId,
    customerName,
    description,
    amount,
    dueDate,
    receivedDate,
    status,
    paymentMethod,
    financialAccountId,
    financialAccountName,
    notes: notes ?? null,
    overdue: status === 'PENDING' && dueDate < day(0),
    createdAt: isoAt(-10),
    updatedAt: isoAt(-1),
  };
}

function finEntry(id, type, description, amount, financialAccountId, financialAccountName, entryDate, accountPayableId, accountReceivableId) {
  return {
    id,
    type,
    description,
    amount,
    financialAccountId,
    financialAccountName,
    accountPayableId: accountPayableId ?? null,
    accountReceivableId: accountReceivableId ?? null,
    entryDate,
    createdAt: isoAt(-10),
    updatedAt: isoAt(-1),
  };
}

export function buildFinanceiroMock() {
  return {
    payables: [
      payable(41, 2, 'Distribuidora Panifício', 'Compra de insumos — NF 5538', 'SUPPLIES', 437.6, day(2), null, 'PENDING', null, null, null, null),
      payable(40, null, null, 'Conta de energia — fornos', 'UTILITIES', 682.3, day(-3), null, 'PENDING', null, null, null, 'Segunda via emitida'),
      payable(39, 3, 'Laticínios Vale Verde', 'Laticínios — NF 2210', 'SUPPLIES', 484.2, day(5), null, 'PENDING', null, null, null, null),
      payable(38, null, null, 'Aluguel do ponto — novembro', 'RENT', 3200.0, day(-10), day(-9), 'PAID', 'PIX', 1, 'Banco principal', null),
      payable(37, 1, 'Moinho Trigo Nobre', 'Farinha — NF 5301', 'SUPPLIES', 400.0, day(-15), day(-14), 'PAID', 'DEBIT_CARD', 1, 'Banco principal', null),
      payable(36, null, null, 'Manutenção do forno a gás', 'MAINTENANCE', 350.0, day(-20), null, 'CANCELED', null, null, null, 'Serviço não realizado'),
    ],

    receivables: [
      receivable(22, 4, 'Lanchonete Central', 'Encomenda semanal — semana 44', 135.6, day(3), null, 'PENDING', null, null, null, null),
      receivable(21, 5, 'Padoca do Bairro', 'Atacado — pães e integrais', 140.0, day(-1), null, 'PENDING', null, null, null, null),
      receivable(20, 1, 'Maria Silva', 'Crediário — festa de aniversário', 220.0, day(-8), day(-7), 'RECEIVED', 'PIX', 1, 'Banco principal', null),
      receivable(19, 3, 'João Pereira', 'Encomenda de salgados', 96.5, day(-15), day(-15), 'RECEIVED', 'CASH', 2, 'Caixa da loja', null),
    ],

    financialEntries: [
      finEntry(9, 'EXIT', 'Sangria de caixa — depósito no cofre', 150.0, 2, 'Caixa da loja', isoAt(0, 11, 30), null, null),
      finEntry(8, 'ENTRY', 'Venda balcão — turno da manhã', 465.9, 2, 'Caixa da loja', isoAt(0, 12, 5), null, null),
      finEntry(7, 'EXIT', 'Taxa de manutenção — conta BB', 39.9, 1, 'Banco principal', isoAt(-1, 8), null, null),
      finEntry(6, 'ENTRY', 'Vendas em cartão — liquidação lote 118', 1840.3, 1, 'Banco principal', isoAt(-2, 18), null, null),
      finEntry(5, 'ENTRY', 'Rendimento poupança — outubro', 58.4, 3, 'Poupança', isoAt(-5, 9), null, null),
      finEntry(4, 'ENTRY', 'Crediário — festa de aniversário (Maria Silva)', 220.0, 1, 'Banco principal', isoAt(-7, 15), null, 20),
      finEntry(3, 'EXIT', 'Aluguel do ponto — novembro', 3200.0, 1, 'Banco principal', isoAt(-9, 9), 38, null),
      finEntry(2, 'EXIT', 'Farinha — NF 5301 (Moinho Trigo Nobre)', 400.0, 1, 'Banco principal', isoAt(-14, 10), 37, null),
      finEntry(1, 'ENTRY', 'Encomenda de salgados (João Pereira)', 96.5, 2, 'Caixa da loja', isoAt(-15, 11), null, 19),
    ],

    financialAccounts: [
      { id: 1, name: 'Banco principal', type: 'CHECKING', bankName: 'Banco do Brasil', balance: 12480.5, active: true },
      { id: 2, name: 'Caixa da loja', type: 'CASH', bankName: null, balance: 512.8, active: true },
      { id: 3, name: 'Poupança', type: 'SAVINGS', bankName: 'Caixa Econômica', balance: 8200.0, active: true },
    ],

    suppliers: [
      { id: 1, name: 'Moinho Trigo Nobre', active: true },
      { id: 2, name: 'Distribuidora Panifício', active: true },
      { id: 3, name: 'Laticínios Vale Verde', active: true },
      { id: 4, name: 'Embalagens Silva', active: false },
    ],

    customers: [
      { id: 1, name: 'Maria Silva', active: true },
      { id: 2, name: 'Ana Costa', active: true },
      { id: 3, name: 'João Pereira', active: true },
      { id: 4, name: 'Lanchonete Central', active: true },
      { id: 5, name: 'Padoca do Bairro', active: true },
    ],
  };
}
