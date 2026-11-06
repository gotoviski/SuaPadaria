function isoAt(offsetDays, hour, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function item(id, saleId, productId, productName, quantity, unitPrice) {
  return {
    id,
    saleId,
    saleDate: null,
    customerName: null,
    productId,
    productName,
    quantity,
    unitPrice,
    totalPrice: quantity * unitPrice,
  };
}

function payment(id, saleId, method, amount) {
  return { id, saleId, saleDate: null, method, amount };
}

function sale(id, customerId, customerName, employeeName, saleDate, items, payments, notes) {
  const total = items.reduce((sum, i) => sum + i.totalPrice, 0);
  const paidTotal = payments.reduce((sum, p) => sum + p.amount, 0);
  return {
    id,
    customerId,
    customerName,
    employeeId: 1,
    employeeName,
    cashRegisterId: 1,
    saleDate,
    notes: notes ?? null,
    items,
    payments,
    total,
    paidTotal,
    createdAt: saleDate,
    updatedAt: saleDate,
  };
}

export function buildVendasMock() {
  return {
    sales: [
      sale(
        110,
        3,
        'João Pereira',
        'Ana Souza',
        isoAt(0, 15, 42),
        [
          item(301, 110, 4, 'Bolo de chocolate (fatia)', 2, 8.5),
          item(302, 110, 6, 'Café expresso', 2, 5.0),
        ],
        [payment(401, 110, 'CREDIT_CARD', 27.0)]
      ),
      sale(
        109,
        1,
        'Maria Silva',
        'Ana Souza',
        isoAt(0, 11, 20),
        [
          item(299, 109, 1, 'Pão francês', 10, 0.9),
          item(300, 109, 3, 'Pão de queijo', 6, 3.5),
        ],
        [payment(400, 109, 'PIX', 30.0)]
      ),
      sale(
        108,
        null,
        null,
        'Carlos Lima',
        isoAt(0, 8, 15),
        [
          item(297, 108, 1, 'Pão francês', 12, 0.9),
          item(298, 108, 7, 'Leite integral 1L', 1, 5.8),
        ],
        [payment(398, 108, 'CASH', 10.0), payment(399, 108, 'PIX', 6.6)]
      ),
      sale(
        107,
        4,
        'Lanchonete Central',
        'Carlos Lima',
        isoAt(-1, 16, 45),
        [
          item(295, 107, 2, 'Croissant', 20, 4.5),
          item(296, 107, 5, 'Sonho de creme', 12, 3.8),
        ],
        [payment(397, 107, 'STORE_CREDIT', 135.6)],
        'Encomenda semanal para revenda'
      ),
      sale(
        106,
        2,
        'Ana Costa',
        'Ana Souza',
        isoAt(-1, 10, 5),
        [
          item(293, 106, 4, 'Bolo de chocolate (fatia)', 4, 8.5),
          item(294, 106, 8, 'Brigadeiro', 10, 2.5),
        ],
        [payment(395, 106, 'DEBIT_CARD', 30.0), payment(396, 106, 'CASH', 29.0)]
      ),
      sale(
        105,
        null,
        null,
        'Carlos Lima',
        isoAt(-2, 9, 10),
        [item(292, 105, 1, 'Pão francês', 20, 0.9)],
        []
      ),
      sale(
        104,
        5,
        'Padoca do Bairro',
        'Ana Souza',
        isoAt(-3, 14, 30),
        [
          item(290, 104, 1, 'Pão francês', 50, 0.85),
          item(291, 104, 9, 'Pão integral', 15, 6.5),
        ],
        [payment(394, 104, 'PIX', 140.0)],
        'Desconto de atacado aplicado'
      ),
      sale(
        103,
        1,
        'Maria Silva',
        'Ana Souza',
        isoAt(-4, 8, 50),
        [item(289, 103, 3, 'Pão de queijo', 10, 3.5)],
        [payment(393, 103, 'MEAL_VOUCHER', 35.0)]
      ),
    ],

    customers: [
      { id: 1, name: 'Maria Silva', active: true },
      { id: 2, name: 'Ana Costa', active: true },
      { id: 3, name: 'João Pereira', active: true },
      { id: 4, name: 'Lanchonete Central', active: true },
      { id: 5, name: 'Padoca do Bairro', active: true },
    ],

    products: [
      { id: 1, name: 'Pão francês', unit: 'un', price: 0.9, active: true, manualPrice: true },
      { id: 2, name: 'Croissant', unit: 'un', price: 4.5, active: true },
      { id: 3, name: 'Pão de queijo', unit: 'un', price: 3.5, active: true },
      { id: 4, name: 'Bolo de chocolate (fatia)', unit: 'un', price: 8.5, active: true },
      { id: 5, name: 'Sonho de creme', unit: 'un', price: 3.8, active: true },
      { id: 6, name: 'Café expresso', unit: 'un', price: 5.0, active: true },
      { id: 7, name: 'Leite integral 1L', unit: 'un', price: 5.8, active: true },
      { id: 8, name: 'Brigadeiro', unit: 'un', price: 2.5, active: true },
      { id: 9, name: 'Pão integral', unit: 'un', price: 6.5, active: true },
    ],

    employees: [
      { id: 1, name: 'Ana Souza', role: 'Atendente', active: true },
      { id: 2, name: 'Carlos Lima', role: 'Caixa', active: true },
    ],

    cashRegisters: [
      { id: 1, employeeName: 'Ana Souza', status: 'OPEN', openedAt: isoAt(0, 7, 0) },
      { id: 2, employeeName: 'Carlos Lima', status: 'OPEN', openedAt: isoAt(0, 7, 5) },
    ],
  };
}
