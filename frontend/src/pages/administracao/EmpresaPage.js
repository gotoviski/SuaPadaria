import PagePlaceholder from "../../components/PagePlaceholder/PagePlaceholder";

export default function EmpresaPage() {
  return (
    <PagePlaceholder
      title="Empresa"
      description="Dados cadastrais da empresa."
      endpoint="/api/company"
      icon="briefcase"
    />
  );
}
