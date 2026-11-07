function isoAt(offsetDays, hour = 10, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function ingredient(id, productId, productName, quantity) {
  return { id, productId, productName, quantity };
}

function recipe(id, productId, productName, yieldQuantity, ingredients, extra = {}) {
  return {
    id,
    productId,
    productName,
    yieldQuantity,
    instructions: null,
    notes: null,
    active: true,
    ingredients,
    createdAt: isoAt(-30),
    updatedAt: isoAt(-30),
    ...extra,
  };
}

function consumption(id, productId, productName, quantity) {
  return { id, productId, productName, quantity };
}

function result(id, productId, productName, quantity) {
  return { id, productId, productName, quantity };
}

function order(id, recipeId, productId, productName, plannedQuantity, status, dates, consumptions, results, notes) {
  return {
    id,
    recipeId,
    productId,
    productName,
    plannedQuantity,
    status,
    scheduledDate: dates.scheduledDate ?? null,
    startedAt: dates.startedAt ?? null,
    finishedAt: dates.finishedAt ?? null,
    notes: notes ?? null,
    consumptions,
    results,
    producedQuantity: results.reduce((sum, r) => sum + r.quantity, 0),
    createdAt: dates.scheduledDate ?? isoAt(-5),
    updatedAt: dates.finishedAt ?? dates.startedAt ?? isoAt(-1),
  };
}

export function buildProducaoMock() {
  return {
    productionOrders: [
      order(1044, 3, 8, 'Pão de queijo', 60, 'OPEN',
        { scheduledDate: isoAt(0, 14, 0) },
        [
          consumption(30, 1, 'Farinha de trigo', 1.2),
          consumption(31, 9, 'Leite integral', 0.3),
          consumption(32, 3, 'Manteiga', 0.15),
        ],
        [],
        'Fornada da tarde'
      ),
      order(1043, 2, 7, 'Croissant', 48, 'IN_PROGRESS',
        { scheduledDate: isoAt(0, 7, 0), startedAt: isoAt(0, 6, 45) },
        [
          consumption(26, 1, 'Farinha de trigo', 1.6),
          consumption(27, 3, 'Manteiga', 0.8),
          consumption(28, 2, 'Açúcar refinado', 0.2),
          consumption(29, 9, 'Leite integral', 0.6),
        ],
        [],
        null
      ),
      order(1042, 1, 6, 'Pão francês', 200, 'COMPLETED',
        { scheduledDate: isoAt(0, 5, 30), startedAt: isoAt(0, 5, 20), finishedAt: isoAt(0, 7, 30) },
        [
          consumption(20, 1, 'Farinha de trigo', 10.0),
          consumption(21, 5, 'Fermento biológico', 20),
          consumption(22, 2, 'Açúcar refinado', 0.3),
        ],
        [result(10, 6, 'Pão francês', 195)],
        'Perda de 5 unidades na forma'
      ),
      order(1041, 1, 6, 'Pão francês', 100, 'CANCELLED',
        { scheduledDate: isoAt(-1, 15, 0) },
        [consumption(19, 1, 'Farinha de trigo', 5.0)],
        [],
        'Cancelado — forno em manutenção'
      ),
    ],

    recipes: [
      recipe(1, 6, 'Pão francês', 20, [
        ingredient(1, 1, 'Farinha de trigo', 1.0),
        ingredient(2, 5, 'Fermento biológico', 2),
        ingredient(3, 2, 'Açúcar refinado', 0.03),
      ]),
      recipe(2, 7, 'Croissant', 24, [
        ingredient(4, 1, 'Farinha de trigo', 0.8),
        ingredient(5, 3, 'Manteiga', 0.4),
        ingredient(6, 2, 'Açúcar refinado', 0.1),
        ingredient(7, 9, 'Leite integral', 0.3),
      ]),
      recipe(3, 8, 'Pão de queijo', 30, [
        ingredient(8, 1, 'Farinha de trigo', 0.6),
        ingredient(9, 9, 'Leite integral', 0.15),
        ingredient(10, 3, 'Manteiga', 0.075),
      ]),
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
