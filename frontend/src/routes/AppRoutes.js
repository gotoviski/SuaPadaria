import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout/AppLayout';
import NotFoundPage from '../pages/NotFoundPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import CaixaPage from '../pages/vendas/CaixaPage';
import ClientesPage from '../pages/vendas/ClientesPage';
import TabelasDePrecoPage from '../pages/vendas/TabelasDePrecoPage';
import VendasPage from '../pages/vendas/VendasPage';
import InventariosPage from '../pages/estoque/InventariosPage';
import LocaisPage from '../pages/estoque/LocaisPage';
import LotesPage from '../pages/estoque/LotesPage';
import MovimentacoesPage from '../pages/estoque/MovimentacoesPage';
import SaldosPage from '../pages/estoque/SaldosPage';
import ConsumosPage from '../pages/producao/ConsumosPage';
import OrdensPage from '../pages/producao/OrdensPage';
import ReceitasPage from '../pages/producao/ReceitasPage';
import ResultadosPage from '../pages/producao/ResultadosPage';
import ComprasPage from '../pages/compras/ComprasPage';
import FornecedoresPage from '../pages/compras/FornecedoresPage';
import ContasAPagarPage from '../pages/financeiro/ContasAPagarPage';
import ContasAReceberPage from '../pages/financeiro/ContasAReceberPage';
import ContasFinanceirasPage from '../pages/financeiro/ContasFinanceirasPage';
import LancamentosPage from '../pages/financeiro/LancamentosPage';
import CategoriasPage from '../pages/cadastros/CategoriasPage';
import ProdutosPage from '../pages/cadastros/ProdutosPage';
import UnidadesPage from '../pages/cadastros/UnidadesPage';
import EmpresaPage from '../pages/administracao/EmpresaPage';
import FuncionariosPage from '../pages/administracao/FuncionariosPage';
import PerfisPage from '../pages/administracao/PerfisPage';
import UsuariosPage from '../pages/administracao/UsuariosPage';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />

          <Route path="vendas" element={<VendasPage />} />
          <Route path="vendas/caixa" element={<CaixaPage />} />
          <Route path="vendas/clientes" element={<ClientesPage />} />
          <Route path="vendas/tabelas-de-preco" element={<TabelasDePrecoPage />} />

          <Route path="estoque/saldos" element={<SaldosPage />} />
          <Route path="estoque/movimentacoes" element={<MovimentacoesPage />} />
          <Route path="estoque/lotes" element={<LotesPage />} />
          <Route path="estoque/inventarios" element={<InventariosPage />} />
          <Route path="estoque/locais" element={<LocaisPage />} />

          <Route path="producao/ordens" element={<OrdensPage />} />
          <Route path="producao/receitas" element={<ReceitasPage />} />
          <Route path="producao/resultados" element={<ResultadosPage />} />
          <Route path="producao/consumos" element={<ConsumosPage />} />

          <Route path="compras" element={<ComprasPage />} />
          <Route path="compras/fornecedores" element={<FornecedoresPage />} />

          <Route path="financeiro/contas-a-pagar" element={<ContasAPagarPage />} />
          <Route path="financeiro/contas-a-receber" element={<ContasAReceberPage />} />
          <Route path="financeiro/contas" element={<ContasFinanceirasPage />} />
          <Route path="financeiro/lancamentos" element={<LancamentosPage />} />

          <Route path="cadastros/produtos" element={<ProdutosPage />} />
          <Route path="cadastros/categorias" element={<CategoriasPage />} />
          <Route path="cadastros/unidades" element={<UnidadesPage />} />

          <Route path="admin/empresa" element={<EmpresaPage />} />
          <Route path="admin/funcionarios" element={<FuncionariosPage />} />
          <Route path="admin/usuarios" element={<UsuariosPage />} />
          <Route path="admin/perfis" element={<PerfisPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
