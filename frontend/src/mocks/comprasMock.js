function isoAt(offsetDays, hour = 10, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function item(id, productId, productName, quantity, unitPrice) {
  return { id, productId, productName, quantity, unitPrice, totalPrice: quantity * unitPrice };
}

function purchase(id, supplierId, supplierName, purchaseDate, items, notes) {
  return {
    id,
    supplierId,
    supplierName,
    purchaseDate,
    notes: notes ?? null,
    items,
    total: items.reduce((sum, i) => sum + i.totalPrice, 0),
    createdAt: purchaseDate,
    updatedAt: purchaseDate,
  };
}

function supplier(id, name, extra = {}) {
  return {
    id,
    name,
    legalName: null,
    cnpj: null,
    contactName: null,
    phone: null,
    email: null,
    zipCode: null,
    street: null,
    number: null,
    complement: null,
    district: null,
    city: null,
    state: null,
    notes: null,
    active: true,
    createdAt: isoAt(-60),
    updatedAt: isoAt(-60),
    ...extra,
  };
}

export function buildComprasMock() {
  return {
    purchases: [
      purchase(32, 1, 'Moinho Trigo Nobre', isoAt(0, 6, 50), [
        item(90, 9, 'Leite integral', 24, 4.9),
      ]),
      purchase(31, 2, 'Distribuidora Panifício', isoAt(-1, 9, 40), [
        item(87, 1, 'Farinha de trigo', 50, 4.2),
        item(88, 5, 'Fermento biológico', 30, 1.8),
        item(89, 2, 'Açúcar refinado', 25, 3.6),
      ]),
      purchase(30, 3, 'Laticínios Vale Verde', isoAt(-2, 8, 15), [
        item(85, 3, 'Manteiga', 10, 24.9),
        item(86, 9, 'Leite integral', 48, 4.9),
      ]),
      purchase(29, 2, 'Distribuidora Panifício', isoAt(-4, 10, 20), [
        item(84, 4, 'Chocolate em barra', 6, 32.5),
      ]),
      purchase(28, 1, 'Moinho Trigo Nobre', isoAt(-7, 11, 0), [
        item(82, 1, 'Farinha de trigo', 100, 4.0),
        item(83, 2, 'Açúcar refinado', 20, 3.55),
      ], 'Compra mensal de insumos básicos'),
    ],

    suppliers: [
      supplier(1, 'Moinho Trigo Nobre', {
        legalName: 'Moinho Trigo Nobre S.A.',
        cnpj: '12345678000190',
        contactName: 'Ricardo Alves',
        phone: '1135551234',
        email: 'vendas@trigonobre.com.br',
        city: 'São Paulo',
        state: 'SP',
      }),
      supplier(2, 'Distribuidora Panifício', {
        legalName: 'Distribuidora Panifício Ltda.',
        cnpj: '98765432000111',
        contactName: 'Fernanda Costa',
        phone: '1140028922',
        email: 'pedidos@panificio.com.br',
        street: 'Rod. Anhanguera, km 28',
        district: 'Distrito Industrial',
        city: 'Osasco',
        state: 'SP',
        notes: 'Entrega segundas e quintas',
      }),
      supplier(3, 'Laticínios Vale Verde', {
        legalName: 'Laticínios Vale Verde Eireli',
        cnpj: '11222333000144',
        contactName: 'Paulo Mendes',
        phone: '1938887766',
        email: 'comercial@valeverde.com.br',
        city: 'Campinas',
        state: 'SP',
      }),
      supplier(4, 'Embalagens Silva', {
        cnpj: '55666777000122',
        phone: '1197776655',
        city: 'Guarulhos',
        state: 'SP',
        active: false,
      }),
    ],

    products: [
      { id: 1, name: 'Farinha de trigo', unit: 'kg', active: true },
      { id: 2, name: 'Açúcar refinado', unit: 'kg', active: true },
      { id: 3, name: 'Manteiga', unit: 'kg', active: true },
      { id: 4, name: 'Chocolate em barra', unit: 'kg', active: true },
      { id: 5, name: 'Fermento biológico', unit: 'un', active: true },
      { id: 9, name: 'Leite integral', unit: 'L', active: true },
      { id: 10, name: 'Embalagem pão 500g', unit: 'pct', active: true },
    ],
  };
}
