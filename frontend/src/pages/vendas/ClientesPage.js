import PagePlaceholder from "../../components/PagePlaceholder/PagePlaceholder";

export default function ClientesPage() {
  return (
    <PagePlaceholder
      title="Clientes"
      description="Cadastro e histórico de clientes."
      endpoint="/api/customers"
      icon="users"
    />
  );
}
