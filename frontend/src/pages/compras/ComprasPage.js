import PagePlaceholder from "../../components/PagePlaceholder/PagePlaceholder";

export default function ComprasPage() {
  return (
    <PagePlaceholder
      title="Compras"
      description="Pedidos de compra e itens adquiridos."
      endpoint="/api/purchases"
      icon="truck"
    />
  );
}
