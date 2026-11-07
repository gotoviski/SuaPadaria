function isoAt(offsetDays, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function balance(id, productId, productName, locationId, locationName, quantity, offsetDays) {
  return {
    id,
    productId,
    productName,
    locationId,
    locationName,
    quantity,
    createdAt: isoAt(offsetDays - 10),
    updatedAt: isoAt(offsetDays),
  };
}

function movement(id, productId, productName, locationId, locationName, batchId, batchNumber, type, quantity, reason, reference, movementDate) {
  return {
    id,
    productId,
    productName,
    locationId,
    locationName,
    batchId,
    batchNumber,
    type,
    quantity,
    reason,
    reference,
    movementDate,
    notes: null,
    createdAt: movementDate,
    updatedAt: movementDate,
  };
}

function batch(id, productId, productName, locationId, locationName, batchNumber, quantity, manufactureDate, expirationDate) {
  return {
    id,
    productId,
    productName,
    locationId,
    locationName,
    batchNumber,
    quantity,
    manufactureDate,
    expirationDate,
    notes: null,
    createdAt: isoAt(-10),
    updatedAt: isoAt(-1),
  };
}

export function buildEstoqueMock() {
  return {
    stockBalances: [
      balance(1, 1, 'Farinha de trigo', 1, 'Depósito central', 48.5, 0),
      balance(2, 2, 'Açúcar refinado', 1, 'Depósito central', 22.0, -1),
      balance(3, 3, 'Manteiga', 2, 'Câmara fria', 8.2, 0),
      balance(4, 4, 'Chocolate em barra', 1, 'Depósito central', 5.75, -2),
      balance(5, 5, 'Fermento biológico', 2, 'Câmara fria', 0, -1),
      balance(6, 6, 'Pão francês', 3, 'Balcão', 120, 0),
      balance(7, 7, 'Croissant', 3, 'Balcão', 34, 0),
      balance(8, 8, 'Pão de queijo', 3, 'Balcão', 0, -3),
      balance(9, 9, 'Leite integral', 2, 'Câmara fria', 18.0, 0),
      balance(10, 1, 'Farinha de trigo', 3, 'Balcão', 4.0, -1),
    ],

    stockMovements: [
      movement(21, 6, 'Pão francês', 3, 'Balcão', null, null, 'ENTRY', 150, 'Produção do dia', 'OP-1042', isoAt(0, 7, 30)),
      movement(20, 7, 'Croissant', 3, 'Balcão', null, null, 'ENTRY', 40, 'Produção do dia', 'OP-1043', isoAt(0, 7, 35)),
      movement(19, 6, 'Pão francês', 3, 'Balcão', null, null, 'EXIT', 30, 'Venda', 'VD-108', isoAt(0, 8, 15)),
      movement(18, 9, 'Leite integral', 2, 'Câmara fria', null, null, 'ENTRY', 24, 'Compra', 'NF-5541', isoAt(0, 6, 50)),
      movement(17, 8, 'Pão de queijo', 3, 'Balcão', null, null, 'EXIT', 12, 'Venda', 'VD-109', isoAt(0, 11, 22)),
      movement(16, 5, 'Fermento biológico', 2, 'Câmara fria', null, null, 'EXIT', 8, 'Perda por vencimento', null, isoAt(-1, 17, 10)),
      movement(15, 1, 'Farinha de trigo', 1, 'Depósito central', 3, 'LT-2025-09', 'EXIT', 10, 'Consumo em produção', 'OP-1040', isoAt(-1, 8, 5)),
      movement(14, 1, 'Farinha de trigo', 1, 'Depósito central', 3, 'LT-2025-09', 'ENTRY', 50, 'Compra', 'NF-5538', isoAt(-2, 9, 40)),
      movement(13, 3, 'Manteiga', 2, 'Câmara fria', null, null, 'ADJUSTMENT', 2, 'Ajuste de inventário', 'INV-118', isoAt(-2, 18, 0)),
      movement(12, 4, 'Chocolate em barra', 1, 'Depósito central', null, null, 'ENTRY', 6, 'Compra', 'NF-5522', isoAt(-3, 10, 15)),
    ],

    stockBatches: [
      batch(3, 1, 'Farinha de trigo', 1, 'Depósito central', 'LT-2025-09', 38.5, '2025-11-20', '2026-05-20'),
      batch(4, 9, 'Leite integral', 2, 'Câmara fria', 'LT-LEITE-11', 18.0, '2026-11-01', '2026-11-14'),
      batch(5, 3, 'Manteiga', 2, 'Câmara fria', 'LT-MANT-08', 8.2, '2026-10-10', '2026-12-01'),
      batch(6, 5, 'Fermento biológico', 2, 'Câmara fria', 'LT-FERM-07', 0, '2026-08-15', '2026-10-30'),
      batch(7, 4, 'Chocolate em barra', 1, 'Depósito central', 'LT-CHOC-12', 5.75, '2026-09-01', '2027-03-01'),
    ],

    storageLocations: [
      { id: 1, name: 'Depósito central', description: 'Almoxarifado de insumos', active: true },
      { id: 2, name: 'Câmara fria', description: 'Perecíveis refrigerados', active: true },
      { id: 3, name: 'Balcão', description: 'Produtos prontos para venda', active: true },
    ],

    products: [
      { id: 1, name: 'Farinha de trigo', unit: 'kg', active: true },
      { id: 2, name: 'Açúcar refinado', unit: 'kg', active: true },
      { id: 3, name: 'Manteiga', unit: 'kg', active: true },
      { id: 4, name: 'Chocolate em barra', unit: 'kg', active: true },
      { id: 5, name: 'Fermento biológico', unit: 'un', active: true },
      { id: 6, name: 'Pão francês', unit: 'un', active: true },
      { id: 7, name: 'Croissant', unit: 'un', active: true },
      { id: 8, name: 'Pão de queijo', unit: 'un', active: true },
      { id: 9, name: 'Leite integral', unit: 'L', active: true },
    ],
  };
}
