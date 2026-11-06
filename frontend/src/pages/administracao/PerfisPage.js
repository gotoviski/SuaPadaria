import PagePlaceholder from "../../components/PagePlaceholder/PagePlaceholder";

export default function PerfisPage() {
  return (
    <PagePlaceholder
      title="Perfis de acesso"
      description="Perfis e permissões de acesso."
      endpoint="/api/profiles"
      icon="shield"
    />
  );
}
