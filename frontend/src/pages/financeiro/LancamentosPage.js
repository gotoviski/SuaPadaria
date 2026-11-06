import PagePlaceholder from "../../components/PagePlaceholder/PagePlaceholder";

export default function LancamentosPage() {
  return (
    <PagePlaceholder
      title="Lançamentos financeiros"
      description="Lançamentos e movimentações financeiras."
      endpoint="/api/financial-entries"
      icon="file"
    />
  );
}
