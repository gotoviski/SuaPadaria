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

export function buildEstoqueMock() {
  return {
    stockBalances: [
      balance(1, 1, 'Farinha de trigo (kg)', 1, 'Depósito central', 48.5, 0),
      balance(2, 2, 'Açúcar refinado (kg)', 1, 'Depósito central', 22.0, -1),
      balance(3, 3, 'Manteiga (kg)', 2, 'Câmara fria', 8.2, 0),
      balance(4, 4, 'Chocolate em barra (kg)', 1, 'Depósito central', 5.75, -2),
      balance(5, 5, 'Fermento biológico (un)', 2, 'Câmara fria', 0, -1),
      balance(6, 6, 'Pão francês (un)', 3, 'Balcão', 120, 0),
      balance(7, 7, 'Croissant (un)', 3, 'Balcão', 34, 0),
      balance(8, 8, 'Pão de queijo (un)', 3, 'Balcão', 0, -3),
      balance(9, 9, 'Leite integral (L)', 2, 'Câmara fria', 18.0, 0),
      balance(10, 1, 'Farinha de trigo (kg)', 3, 'Balcão', 4.0, -1),
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
