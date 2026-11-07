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

function employee(id, name, role, shift, salary, hireDate, active, extras = {}) {
  return {
    id,
    name,
    cpf: extras.cpf ?? null,
    phone: extras.phone ?? null,
    email: extras.email ?? null,
    birthDate: extras.birthDate ?? null,
    role,
    shift,
    salary,
    hireDate,
    zipCode: null,
    street: null,
    number: null,
    complement: null,
    district: null,
    city: null,
    state: null,
    notes: extras.notes ?? null,
    active: active !== false,
    createdAt: isoAt(-60),
    updatedAt: isoAt(-3),
  };
}

export function buildAdministracaoMock() {
  const accessProfiles = [
    {
      id: 1,
      name: 'Administrador',
      description: 'Acesso total ao sistema',
      permissions: [
        'COMPANY_VIEW', 'COMPANY_MANAGE', 'USERS_VIEW', 'USERS_MANAGE', 'PROFILES_VIEW',
        'PROFILES_MANAGE', 'PRODUCTS_VIEW', 'PRODUCTS_MANAGE', 'PRICE_TABLES_VIEW',
        'PRICE_TABLES_MANAGE', 'CUSTOMERS_VIEW', 'CUSTOMERS_MANAGE', 'ORDERS_VIEW',
        'ORDERS_MANAGE', 'SALES_VIEW', 'SALES_MANAGE', 'STOCK_VIEW', 'STOCK_MANAGE',
        'REPORTS_VIEW',
      ],
      createdAt: isoAt(-60),
      updatedAt: isoAt(-3),
    },
    {
      id: 2,
      name: 'Gerente',
      description: 'Gestão operacional sem administração de usuários',
      permissions: [
        'COMPANY_VIEW', 'PRODUCTS_VIEW', 'PRODUCTS_MANAGE', 'PRICE_TABLES_VIEW',
        'PRICE_TABLES_MANAGE', 'CUSTOMERS_VIEW', 'CUSTOMERS_MANAGE', 'ORDERS_VIEW',
        'ORDERS_MANAGE', 'SALES_VIEW', 'SALES_MANAGE', 'STOCK_VIEW', 'STOCK_MANAGE',
        'REPORTS_VIEW',
      ],
      createdAt: isoAt(-60),
      updatedAt: isoAt(-3),
    },
    {
      id: 3,
      name: 'Operador de caixa',
      description: 'Vendas e consulta de produtos',
      permissions: ['PRODUCTS_VIEW', 'CUSTOMERS_VIEW', 'SALES_VIEW', 'SALES_MANAGE'],
      createdAt: isoAt(-60),
      updatedAt: isoAt(-3),
    },
  ];

  return {
    company: {
      id: 1,
      tradeName: 'Padaria Pão Quente',
      legalName: 'Padaria Pão Quente LTDA',
      cnpj: '12345678000190',
      email: 'contato@paoquente.com.br',
      phone: '(11) 3456-7890',
      zipCode: '01310-100',
      street: 'Av. Paulista',
      number: '1000',
      complement: 'Loja 2',
      district: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      openingHours: 'Seg a Sáb — 6h às 20h; Dom — 6h às 14h',
      logoUrl: null,
      createdAt: isoAt(-120),
      updatedAt: isoAt(-3),
    },

    employees: [
      employee(4, 'Beatriz Rocha', 'Padeira', 'MADRUGADA', 3200.0, day(-900), true, {
        cpf: '12345678901', phone: '(11) 98765-4321', email: 'bia@paoquente.com.br',
        notes: 'Responsável pelos fornos',
      }),
      employee(3, 'Carlos Lima', 'Caixa', 'TARDE', 2100.0, day(-400), true, {
        cpf: '23456789012', phone: '(11) 97654-3210', email: 'carlos@paoquente.com.br',
      }),
      employee(2, 'Ana Souza', 'Atendente', 'MANHA', 1950.0, day(-700), true, {
        cpf: '34567890123', phone: '(11) 96543-2109', email: 'ana@paoquente.com.br',
      }),
      employee(1, 'João Ferreira', 'Motoboy', 'TARDE', 1800.0, day(-200), false, {
        cpf: '45678901234', notes: 'Desligado em outubro',
      }),
    ],

    users: [
      { id: 1, name: 'Admin', email: 'admin@paoquente.com.br', phone: null, profile: accessProfiles[0], createdAt: isoAt(-120) },
      { id: 2, name: 'Ana Souza', email: 'ana@paoquente.com.br', phone: '(11) 96543-2109', profile: accessProfiles[2], createdAt: isoAt(-60) },
      { id: 3, name: 'Carlos Lima', email: 'carlos@paoquente.com.br', phone: '(11) 97654-3210', profile: accessProfiles[1], createdAt: isoAt(-55) },
    ],

    accessProfiles,
  };
}
