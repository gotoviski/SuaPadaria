import PagePlaceholder from "../../components/PagePlaceholder/PagePlaceholder";

export default function InventariosPage() {
  return (
    <PagePlaceholder
      title="Inventários"
      description="Contagens físicas e itens de inventário."
      endpoint="/api/inventories"
      icon="clipboard"
    />
  );
}
