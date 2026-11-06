import PagePlaceholder from "../../components/PagePlaceholder/PagePlaceholder";

export default function FuncionariosPage() {
  return (
    <PagePlaceholder
      title="Funcionários"
      description="Cadastro e cargos dos funcionários."
      endpoint="/api/employees"
      icon="id-badge"
    />
  );
}
