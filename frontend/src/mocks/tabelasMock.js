function isoAt(offsetDays, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function table(id, name, description, active, items, offsetDays = -30) {
  return {
    id,
    name,
    description,
    active,
    items,
    createdAt: isoAt(offsetDays),
    updatedAt: isoAt(offsetDays),
  };
}

function item(id, productId, productName, price) {
  return { id, productId, productName, price };
}

export function buildTabelasMock() {
  return {
    priceTables: [
      table(1, 'Varejo', 'Preços padrão de balcão', true, [
        item(1, 1, 'Pão francês', 0.9),
        item(2, 2, 'Croissant', 4.5),
        item(3, 3, 'Pão de queijo', 3.5),
        item(4, 4, 'Bolo de chocolate (fatia)', 8.5),
        item(5, 5, 'Sonho de creme', 3.8),
        item(6, 6, 'Café expresso', 5.0),
      ]),
      table(2, 'Atacado', 'Preços para revendedores e grandes volumes', true, [
        item(7, 1, 'Pão francês', 0.75),
        item(8, 2, 'Croissant', 3.9),
        item(9, 3, 'Pão de queijo', 2.9),
        item(10, 9, 'Pão integral', 5.5),
      ]),
      table(3, 'Encomendas', 'Tabela antiga de encomendas — substituída pelo atacado', false, [
        item(11, 4, 'Bolo de chocolate (fatia)', 7.9),
        item(12, 5, 'Sonho de creme', 3.4),
      ]),
    ],

    products: [
      { id: 1, name: 'Pão francês', unit: 'un', price: 0.9, active: true },
      { id: 2, name: 'Croissant', unit: 'un', price: 4.5, active: true },
      { id: 3, name: 'Pão de queijo', unit: 'un', price: 3.5, active: true },
      { id: 4, name: 'Bolo de chocolate (fatia)', unit: 'un', price: 8.5, active: true },
      { id: 5, name: 'Sonho de creme', unit: 'un', price: 3.8, active: true },
      { id: 6, name: 'Café expresso', unit: 'un', price: 5.0, active: true },
      { id: 7, name: 'Leite integral 1L', unit: 'un', price: 5.8, active: true },
      { id: 8, name: 'Brigadeiro', unit: 'un', price: 2.5, active: true },
      { id: 9, name: 'Pão integral', unit: 'un', price: 6.5, active: true },
    ],
  };
}
