import PagePlaceholder from "../../components/PagePlaceholder/PagePlaceholder";

export default function MovimentacoesPage() {
  return (
    <PagePlaceholder
      title="Movimentações de estoque"
      description="Entradas, saídas e transferências de estoque."
      endpoint="/api/stock-movements"
      icon="move"
    />
  );
}
