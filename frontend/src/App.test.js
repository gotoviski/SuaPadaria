import { render, screen } from '@testing-library/react';
import App from './App';

test('renders sidebar with brand and navigation groups', () => {
  render(<App />);
  expect(screen.getByText('SuaPadaria')).toBeInTheDocument();
  expect(screen.getAllByText('Vendas').length).toBeGreaterThan(0);
  expect(screen.getByText('Estoque')).toBeInTheDocument();
  expect(screen.getByText('Financeiro')).toBeInTheDocument();
});
