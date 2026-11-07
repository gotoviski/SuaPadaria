function isoAt(offsetDays, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function customer(id, name, phone, extra = {}) {
  return {
    id,
    name,
    phone,
    email: null,
    cpf: null,
    birthDate: null,
    zipCode: null,
    street: null,
    number: null,
    complement: null,
    district: null,
    city: null,
    state: null,
    notes: null,
    active: true,
    createdAt: isoAt(-30),
    updatedAt: isoAt(-30),
    ...extra,
  };
}

export function buildClientesMock() {
  return [
    customer(1, 'Maria Silva', '11987654321', {
      email: 'maria.silva@email.com',
      cpf: '12345678901',
      street: 'Rua das Flores',
      number: '120',
      district: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      createdAt: isoAt(-120),
    }),
    customer(2, 'Ana Costa', '11976543210', {
      email: 'ana.costa@email.com',
      city: 'São Paulo',
      state: 'SP',
      createdAt: isoAt(-90),
    }),
    customer(3, 'João Pereira', '11965432109', {
      cpf: '98765432100',
      street: 'Av. Paulista',
      number: '1500',
      district: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      createdAt: isoAt(-60),
    }),
    customer(4, 'Lanchonete Central', '1133224455', {
      email: 'compras@lanchonetecentral.com.br',
      street: 'Rua do Comércio',
      number: '45',
      district: 'Sé',
      city: 'São Paulo',
      state: 'SP',
      notes: 'Encomenda semanal de croissants às segundas',
      createdAt: isoAt(-45),
    }),
    customer(5, 'Padoca do Bairro', '1144332211', {
      email: 'contato@padocadobairro.com.br',
      city: 'São Paulo',
      state: 'SP',
      notes: 'Cliente atacado — desconto de 10%',
      createdAt: isoAt(-30),
    }),
    customer(6, 'José Santos', '11998877665', {
      active: false,
      createdAt: isoAt(-200),
      updatedAt: isoAt(-10),
    }),
  ];
}
