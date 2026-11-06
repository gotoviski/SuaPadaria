function isoAt(date, hour, minute = 0) {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function dateOnly(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function buildDashboardMock() {
  const now = new Date();
  const at = (offsetDays, hour, minute) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offsetDays);
    return isoAt(d, hour, minute);
  };

  return {
    sales: [
      {
        id: 101,
        saleDate: at(0, 8, 15),
        total: 42.5,
        customerName: 'Maria Silva',
        payments: [{ method: 'PIX' }],
      },
      {
        id: 102,
        saleDate: at(0, 9, 40),
        total: 18.9,
        customerName: 'Balcão',
        payments: [{ method: 'CASH' }],
      },
      {
        id: 103,
        saleDate: at(0, 11, 5),
        total: 67.3,
        customerName: 'João Pereira',
        payments: [{ method: 'CREDIT_CARD' }],
      },
      {
        id: 104,
        saleDate: at(-1, 10, 20),
        total: 55.0,
        customerName: 'Padoca do Bairro',
        payments: [{ method: 'PIX' }],
      },
      {
        id: 105,
        saleDate: at(-1, 16, 45),
        total: 31.2,
        customerName: 'Balcão',
        payments: [{ method: 'DEBIT_CARD' }],
      },
      {
        id: 106,
        saleDate: at(-2, 9, 10),
        total: 88.4,
        customerName: 'Ana Costa',
        payments: [{ method: 'STORE_CREDIT' }],
      },
      {
        id: 107,
        saleDate: at(-3, 14, 30),
        total: 24.75,
        customerName: 'Balcão',
        payments: [{ method: 'CASH' }],
      },
      {
        id: 108,
        saleDate: at(-4, 8, 50),
        total: 49.9,
        customerName: 'Carlos Souza',
        payments: [{ method: 'PIX' }],
      },
      {
        id: 109,
        saleDate: at(-5, 12, 15),
        total: 73.6,
        customerName: 'Lanchonete Central',
        payments: [{ method: 'CREDIT_CARD' }],
      },
      {
        id: 110,
        saleDate: at(-6, 17, 5),
        total: 15.0,
        customerName: 'Balcão',
        payments: [{ method: 'CASH' }],
      },
    ],

    productionOrders: [
      {
        id: 21,
        productName: 'Pão francês',
        plannedQuantity: 400,
        scheduledDate: at(0, 5, 0),
        status: 'IN_PROGRESS',
      },
      {
        id: 22,
        productName: 'Bolo de chocolate',
        plannedQuantity: 12,
        scheduledDate: at(0, 13, 0),
        status: 'OPEN',
      },
      {
        id: 23,
        productName: 'Pão de queijo',
        plannedQuantity: 250,
        scheduledDate: at(1, 5, 30),
        status: 'OPEN',
      },
      {
        id: 24,
        productName: 'Croissant',
        plannedQuantity: 80,
        scheduledDate: at(1, 6, 0),
        status: 'OPEN',
      },
      {
        id: 25,
        productName: 'Pão integral',
        plannedQuantity: 120,
        scheduledDate: at(-1, 5, 0),
        status: 'COMPLETED',
      },
    ],

    stockBalances: [
      { productId: 1, productName: 'Farinha de trigo (kg)', quantity: 38.5 },
      { productId: 2, productName: 'Fermento biológico (kg)', quantity: 4.2 },
      { productId: 3, productName: 'Açúcar refinado (kg)', quantity: 22.0 },
      { productId: 4, productName: 'Leite integral (L)', quantity: 9.5 },
      { productId: 5, productName: 'Manteiga (kg)', quantity: 0 },
      { productId: 6, productName: 'Ovos (dúzia)', quantity: 14 },
      { productId: 7, productName: 'Chocolate em pó (kg)', quantity: 2.8 },
      { productId: 8, productName: 'Embalagem pão francês (un)', quantity: 320 },
    ],

    accountsPayable: [
      {
        id: 11,
        description: 'Compra de farinha',
        supplierName: 'Moinho Trigo Bom',
        amount: 1250.0,
        dueDate: dateOnly(-2),
        status: 'PENDING',
      },
      {
        id: 12,
        description: 'Conta de energia',
        supplierName: 'Distribuidora de Energia',
        amount: 890.4,
        dueDate: dateOnly(3),
        status: 'PENDING',
      },
      {
        id: 13,
        description: 'Embalagens',
        supplierName: 'Embala Tudo',
        amount: 432.9,
        dueDate: dateOnly(6),
        status: 'PENDING',
      },
      {
        id: 14,
        description: 'Aluguel',
        supplierName: 'Imobiliária Centro',
        amount: 3200.0,
        dueDate: dateOnly(12),
        status: 'PENDING',
      },
    ],

    accountsReceivable: [
      {
        id: 31,
        description: 'Encomenda - festa junina',
        customerName: 'Escola Pequeno Saber',
        amount: 780.0,
        dueDate: dateOnly(2),
        status: 'PENDING',
      },
      {
        id: 32,
        description: 'Fornecimento semanal',
        customerName: 'Lanchonete Central',
        amount: 420.5,
        dueDate: dateOnly(5),
        status: 'PENDING',
      },
      {
        id: 33,
        description: 'Crediário',
        customerName: 'Ana Costa',
        amount: 88.4,
        dueDate: dateOnly(-4),
        status: 'PENDING',
      },
      {
        id: 34,
        description: 'Encomenda - aniversário',
        customerName: 'Maria Silva',
        amount: 150.0,
        dueDate: dateOnly(15),
        status: 'PAID',
      },
    ],

    cashRegisters: [
      { id: 1, name: 'Caixa 01', status: 'OPEN' },
      { id: 2, name: 'Caixa 02', status: 'CLOSED' },
    ],
  };
}
