import PagePlaceholder from "../../components/PagePlaceholder/PagePlaceholder";

export default function ProdutosPage() {
  return (
    <PagePlaceholder
      title="Produtos"
      description="Catálogo de produtos e insumos."
      endpoint="/api/products"
      icon="bag"
    />
  );
}
