import PagePlaceholder from "../../components/PagePlaceholder/PagePlaceholder";

export default function CaixaPage() {
  return (
    <PagePlaceholder
      title="Caixa"
      description="Abertura, fechamento e movimentações de caixa."
      endpoint="/api/cash-registers"
      icon="cash"
    />
  );
}
