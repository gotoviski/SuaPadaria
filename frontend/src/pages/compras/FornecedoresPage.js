import PagePlaceholder from "../../components/PagePlaceholder/PagePlaceholder";

export default function FornecedoresPage() {
  return (
    <PagePlaceholder
      title="Fornecedores"
      description="Cadastro e gestão de fornecedores."
      endpoint="/api/suppliers"
      icon="user-check"
    />
  );
}
