function isoAt(offsetDays, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function product(id, name, description, category, unit, price, sku, notes, active) {
  return {
    id,
    name,
    description: description ?? null,
    category: category ?? null,
    unit: unit ?? null,
    price: price ?? null,
    sku: sku ?? null,
    notes: notes ?? null,
    active: active !== false,
    createdAt: isoAt(-30),
    updatedAt: isoAt(-2),
  };
}

export function buildCadastrosMock() {
  return {
    products: [
      product(13, 'Panetone artesanal', 'Panetone com frutas cristalizadas', 'Sazonais', 'un', 42.0, 'PAN-ART', 'Disponível em novembro e dezembro', false),
      product(12, 'Fermento biológico', 'Fermento fresco para panificação', 'Insumos', 'un', null, 'INS-FER', null),
      product(11, 'Manteiga', 'Manteiga sem sal para produção', 'Insumos', 'kg', null, 'INS-MAN', null),
      product(10, 'Farinha de trigo', 'Farinha especial tipo 1', 'Insumos', 'kg', null, 'INS-FAR', null),
      product(9, 'Leite integral 1L', 'Leite integral longa vida', 'Bebidas', 'un', 5.8, 'LEI-1L', null),
      product(8, 'Café expresso', 'Café expresso tirado na hora', 'Bebidas', 'un', 5.0, 'CAF-EXP', null),
      product(7, 'Brigadeiro', 'Brigadeiro tradicional de panela', 'Bolos e doces', 'un', 2.5, 'BRI-TRA', null),
      product(6, 'Sonho de creme', 'Sonho recheado com creme de confeiteiro', 'Bolos e doces', 'un', 3.8, 'SON-CRE', null),
      product(5, 'Bolo de chocolate (fatia)', 'Fatia de bolo de chocolate com cobertura', 'Bolos e doces', 'un', 8.5, 'BOL-CHO', null),
      product(4, 'Pão integral', 'Pão de forma integral 400g', 'Pães', 'un', 6.5, 'PAO-INT', null),
      product(3, 'Pão de queijo', 'Pão de queijo mineiro', 'Pães', 'un', 3.5, 'PAO-QUE', null),
      product(2, 'Croissant', 'Croissant de manteiga folheado', 'Pães', 'un', 4.5, 'CRO-MAN', null),
      product(1, 'Pão francês', 'Pão francês tradicional 50g', 'Pães', 'un', 0.9, 'PAO-FRA', null),
    ],

    productCategories: [
      { id: 1, name: 'Pães', description: 'Pães e fermentados', active: true },
      { id: 2, name: 'Bolos e doces', description: 'Bolos, doces e confeitaria', active: true },
      { id: 3, name: 'Bebidas', description: 'Bebidas quentes e frias', active: true },
      { id: 4, name: 'Insumos', description: 'Matérias-primas de produção', active: true },
      { id: 5, name: 'Sazonais', description: 'Produtos sazonais e edições limitadas', active: true },
    ],

    measurementUnits: [
      { id: 1, name: 'Unidade', abbreviation: 'un', active: true },
      { id: 2, name: 'Quilograma', abbreviation: 'kg', active: true },
      { id: 3, name: 'Grama', abbreviation: 'g', active: true },
      { id: 4, name: 'Litro', abbreviation: 'L', active: true },
      { id: 5, name: 'Mililitro', abbreviation: 'ml', active: true },
      { id: 6, name: 'Caixa', abbreviation: 'cx', active: true },
      { id: 7, name: 'Pacote', abbreviation: 'pct', active: true },
    ],
  };
}
