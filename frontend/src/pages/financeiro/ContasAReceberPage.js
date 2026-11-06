import PagePlaceholder from "../../components/PagePlaceholder/PagePlaceholder";

export default function ContasAReceberPage() {
  return (
    <PagePlaceholder
      title="Contas a receber"
      description="Recebíveis de clientes e vendas a prazo."
      endpoint="/api/accounts-receivable"
      icon="arrow-up-circle"
    />
  );
}
