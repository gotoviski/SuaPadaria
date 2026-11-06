import PagePlaceholder from '../components/PagePlaceholder/PagePlaceholder';

export default function NotFoundPage() {
  return (
    <PagePlaceholder
      title="Página não encontrada"
      description="A rota acessada não existe. Verifique o endereço ou volte ao dashboard."
      icon="archive"
    />
  );
}
