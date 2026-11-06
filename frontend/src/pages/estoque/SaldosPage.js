import PagePlaceholder from "../../components/PagePlaceholder/PagePlaceholder";

export default function SaldosPage() {
  return (
    <PagePlaceholder
      title="Saldos de estoque"
      description="Saldo atual de insumos e produtos por local."
      endpoint="/api/stock-balances"
      icon="package"
    />
  );
}
