export const NAVIGATION = [
  {
    id: 'geral',
    title: null,
    items: [{ path: '/', label: 'Dashboard', icon: 'home', end: true }],
  },
  {
    id: 'vendas',
    title: 'Vendas',
    items: [
      { path: '/vendas', label: 'Vendas', icon: 'cart', end: true },
      { path: '/vendas/caixa', label: 'Caixa', icon: 'cash' },
      { path: '/vendas/clientes', label: 'Clientes', icon: 'users' },
      { path: '/vendas/tabelas-de-preco', label: 'Tabelas de preço', icon: 'tag' },
    ],
  },
  {
    id: 'estoque',
    title: 'Estoque',
    items: [
      { path: '/estoque/saldos', label: 'Saldos', icon: 'package' },
      { path: '/estoque/movimentacoes', label: 'Movimentações', icon: 'move' },
      { path: '/estoque/lotes', label: 'Lotes', icon: 'layers' },
      { path: '/estoque/inventarios', label: 'Inventários', icon: 'clipboard' },
      { path: '/estoque/locais', label: 'Locais de armazenamento', icon: 'archive' },
    ],
  },
  {
    id: 'producao',
    title: 'Produção',
    items: [
      { path: '/producao/ordens', label: 'Ordens de produção', icon: 'tool' },
      { path: '/producao/receitas', label: 'Receitas', icon: 'book' },
      { path: '/producao/resultados', label: 'Resultados', icon: 'check' },
      { path: '/producao/consumos', label: 'Consumos', icon: 'minus-circle' },
    ],
  },
  {
    id: 'compras',
    title: 'Compras',
    items: [
      { path: '/compras', label: 'Compras', icon: 'truck', end: true },
      { path: '/compras/fornecedores', label: 'Fornecedores', icon: 'user-check' },
    ],
  },
  {
    id: 'financeiro',
    title: 'Financeiro',
    items: [
      { path: '/financeiro/contas-a-pagar', label: 'Contas a pagar', icon: 'arrow-down-circle' },
      { path: '/financeiro/contas-a-receber', label: 'Contas a receber', icon: 'arrow-up-circle' },
      { path: '/financeiro/contas', label: 'Contas financeiras', icon: 'card' },
      { path: '/financeiro/lancamentos', label: 'Lançamentos', icon: 'file' },
    ],
  },
  {
    id: 'cadastros',
    title: 'Cadastros',
    items: [
      { path: '/cadastros/produtos', label: 'Produtos', icon: 'bag' },
      { path: '/cadastros/categorias', label: 'Categorias', icon: 'folder' },
      { path: '/cadastros/unidades', label: 'Unidades de medida', icon: 'sliders' },
    ],
  },
  {
    id: 'administracao',
    title: 'Administração',
    items: [
      { path: '/admin/empresa', label: 'Empresa', icon: 'briefcase' },
      { path: '/admin/funcionarios', label: 'Funcionários', icon: 'id-badge' },
      { path: '/admin/usuarios', label: 'Usuários', icon: 'user' },
      { path: '/admin/perfis', label: 'Perfis de acesso', icon: 'shield' },
    ],
  },
];

export function pathMatches(item, pathname) {
  if (item.end) return pathname === item.path;
  return pathname === item.path || pathname.startsWith(`${item.path}/`);
}

export function findNavEntry(pathname) {
  let best = null;
  for (const section of NAVIGATION) {
    for (const item of section.items) {
      if (pathMatches(item, pathname) && (!best || item.path.length > best.item.path.length)) {
        best = { section, item };
      }
    }
  }
  return best;
}
