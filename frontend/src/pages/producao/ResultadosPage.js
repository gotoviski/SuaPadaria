import PagePlaceholder from "../../components/PagePlaceholder/PagePlaceholder";

export default function ResultadosPage() {
  return (
    <PagePlaceholder
      title="Resultados de produção"
      description="Produtos gerados e rendimento das produções."
      endpoint="/api/production-results"
      icon="check"
    />
  );
}
