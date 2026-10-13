import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { IntranetBI } from '@/lib/intranet';
import ConsolidatedView from './ConsolidatedView';
vi.mock('./SectorViews', () => ({ ChartView: ({ title }: { title: string }) => <h2>{title}</h2> }));
vi.mock('./CashflowChart', () => ({ default: () => <h2>Entradas, despesas e saldo diário</h2> }));
const sector = { summary: { submissions: 3, pending: 1, users: 2, received_cents: 10000 }, consolidated: [], growth: [], inventory: [] };
const data: IntranetBI = { summary: { received_cents: 10000, expenses_cents: 2500, balance_cents: 7500, submissions: 3, users: 2, campaign_opens: 5, won_leads: 1, open_operations: 4 }, cashflow: [], sources: [], funnel: [{ name: 'ganho', value: 1 }], traffic: [], campaigns: [], operations: [], administration: sector, marketing: sector, commercial: sector };
describe('executive BI', () => {
  it('shows confirmed cash, costs and net balance separately', async () => {
    render(<ConsolidatedView data={data}/>);
    expect(screen.getByText('Receita recebida').parentElement).toHaveTextContent('100,00');
    expect(screen.getByText('Despesas pagas').parentElement).toHaveTextContent('25,00');
    expect(screen.getByText('Saldo do período').parentElement).toHaveTextContent('75,00');
    expect(await screen.findByText('Entradas, despesas e saldo diário')).toBeInTheDocument();
  });
  it('combines operational aggregates without claiming uncollected unique traffic', () => {
    render(<ConsolidatedView data={data}/>);
    expect(screen.getByText('Pendências por setor')).toBeInTheDocument();
    expect(screen.getByText('Receita recebida por produto e plano')).toBeInTheDocument();
    expect(screen.getByText('Aberturas de campanhas').parentElement).toHaveTextContent('5');
    expect(screen.getByText(/não são visitantes únicos/)).toBeInTheDocument();
  });
});