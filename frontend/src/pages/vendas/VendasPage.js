import PagePlaceholder from "../../components/PagePlaceholder/PagePlaceholder";

export default function VendasPage() {
  return (
    <PagePlaceholder
      title="Vendas"
      description="Registro e acompanhamento de vendas, itens e pagamentos."
      endpoint="/api/sales"
      icon="cart"
    />
  );
}
