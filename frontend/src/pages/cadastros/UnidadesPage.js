import PagePlaceholder from "../../components/PagePlaceholder/PagePlaceholder";

export default function UnidadesPage() {
  return (
    <PagePlaceholder
      title="Unidades de medida"
      description="Unidades de medida para estoque e receitas."
      endpoint="/api/measurement-units"
      icon="sliders"
    />
  );
}
