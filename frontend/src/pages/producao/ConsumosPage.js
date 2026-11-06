import PagePlaceholder from "../../components/PagePlaceholder/PagePlaceholder";

export default function ConsumosPage() {
  return (
    <PagePlaceholder
      title="Consumos de produção"
      description="Insumos consumidos em cada produção."
      endpoint="/api/production-consumptions"
      icon="minus-circle"
    />
  );
}
