import PagePlaceholder from "../../components/PagePlaceholder/PagePlaceholder";

export default function ContasAPagarPage() {
  return (
    <PagePlaceholder
      title="Contas a pagar"
      description="Obrigações e pagamentos a fornecedores."
      endpoint="/api/accounts-payable"
      icon="arrow-down-circle"
    />
  );
}
