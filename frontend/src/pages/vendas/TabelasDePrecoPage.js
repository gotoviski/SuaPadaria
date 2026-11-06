import PagePlaceholder from "../../components/PagePlaceholder/PagePlaceholder";

export default function TabelasDePrecoPage() {
  return (
    <PagePlaceholder
      title="Tabelas de preço"
      description="Tabelas de preço e preços por produto."
      endpoint="/api/price-tables"
      icon="tag"
    />
  );
}
