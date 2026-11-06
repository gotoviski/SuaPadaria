import PagePlaceholder from "../../components/PagePlaceholder/PagePlaceholder";

export default function ReceitasPage() {
  return (
    <PagePlaceholder
      title="Receitas"
      description="Fichas técnicas e ingredientes das receitas."
      endpoint="/api/recipes"
      icon="book"
    />
  );
}
