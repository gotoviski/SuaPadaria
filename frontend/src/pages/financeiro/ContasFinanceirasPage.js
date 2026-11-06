import PagePlaceholder from "../../components/PagePlaceholder/PagePlaceholder";

export default function ContasFinanceirasPage() {
  return (
    <PagePlaceholder
      title="Contas financeiras"
      description="Contas bancárias e formas de movimentação."
      endpoint="/api/financial-accounts"
      icon="card"
    />
  );
}
