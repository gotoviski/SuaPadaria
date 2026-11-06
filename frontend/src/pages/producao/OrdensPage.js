import PagePlaceholder from "../../components/PagePlaceholder/PagePlaceholder";

export default function OrdensPage() {
  return (
    <PagePlaceholder
      title="Ordens de produção"
      description="Planejamento e acompanhamento das ordens de produção."
      endpoint="/api/production-orders"
      icon="tool"
    />
  );
}
