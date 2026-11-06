import PagePlaceholder from "../../components/PagePlaceholder/PagePlaceholder";

export default function UsuariosPage() {
  return (
    <PagePlaceholder
      title="Usuários"
      description="Usuários do sistema."
      endpoint="/api/users"
      icon="user"
    />
  );
}
