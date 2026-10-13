import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ExecutiveSectorKpis from './ExecutiveSectorKpis';
import { KPI_DEFINITIONS } from '@/lib/sectorKpis';
vi.mock('./useSectorKpis', () => ({
  useSectorKpis: () => ({ data: { month: '2026-10-01', through: '2026-10-13', previous_from: '2026-09-01', previous_through: '2026-09-13', as_of: '2026-10-13T14:30:00Z', metrics: KPI_DEFINITIONS.map(def => ({ key: def.key, current: def.key === 'latency' ? null : 10, previous: 5, target: def.key === 'leads' ? 20 : null })) }, refetch: vi.fn() }),
  useSaveKpiTargets: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
describe('executive KPI panel', () => {
  it('renders all sectors and truthful target and variation states', () => {
    render(<ExecutiveSectorKpis/>);
    expect(screen.getAllByRole('article')).toHaveLength(10);
    expect(screen.getAllByText('+100%')).toHaveLength(9);
    expect(screen.getByText('Sem base percentual')).toBeInTheDocument();
    expect(screen.getAllByText('Não definida')).toHaveLength(9);
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('Aguardando medição')).toBeInTheDocument();
  });
  it('opens targets only on request and validates numeric input', async () => {
    render(<ExecutiveSectorKpis/>);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Definir metas' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Novos contatos comerciais'), { target: { value: '-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar metas' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Confira a meta');
  });
});