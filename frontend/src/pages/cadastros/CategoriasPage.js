import PagePlaceholder from "../../components/PagePlaceholder/PagePlaceholder";

export default function CategoriasPage() {
  return (
    <PagePlaceholder
      title="Categorias"
      description="Categorias de produtos."
      endpoint="/api/product-categories"
      icon="folder"
    />
  );
}
