import PagePlaceholder from "../../components/PagePlaceholder/PagePlaceholder";

export default function LotesPage() {
  return (
    <PagePlaceholder
      title="Lotes"
      description="Controle de lotes e validades."
      endpoint="/api/stock-batches"
      icon="layers"
    />
  );
}
