import PagePlaceholder from "../../components/PagePlaceholder/PagePlaceholder";

export default function LocaisPage() {
  return (
    <PagePlaceholder
      title="Locais de armazenamento"
      description="Depósitos, câmaras e prateleiras."
      endpoint="/api/storage-locations"
      icon="archive"
    />
  );
}
