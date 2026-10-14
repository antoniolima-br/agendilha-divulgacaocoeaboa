import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { IntranetBI } from '@/lib/intranet';
import ConsolidatedView from './ConsolidatedView';
vi.mock('./ExecutiveSuccessOverview', () => ({ default: () => <><h2>Resultados principais</h2><span>Total de Eventos Ativos</span><span>Total de Pessoas Alcançadas</span><span>Cliques Totais</span></> }));
const sector = { summary: { submissions: 3, pending: 1, users: 2, received_cents: 10000 }, consolidated: [], growth: [], inventory: [] };
const data: IntranetBI = { summary: { received_cents: 10000, expenses_cents: 2500, balance_cents: 7500, submissions: 3, users: 2, campaign_opens: 5, won_leads: 1, open_operations: 4 }, cashflow: [], sources: [], funnel: [{ name: 'ganho', value: 1 }], traffic: [], campaigns: [], operations: [], administration: sector, marketing: sector, commercial: sector };
describe('executive BI', () => {
  it('shows confirmed cash, costs and net balance separately', async () => {
    render(<ConsolidatedView data={data}/>);
    expect(screen.getByText('Receita recebida').parentElement).toHaveTextContent('100,00');
    expect(screen.getByText('Despesas pagas').parentElement).toHaveTextContent('25,00');
    expect(screen.getByText('Saldo do período').parentElement).toHaveTextContent('75,00');
    expect(screen.queryByText('Entradas, despesas e saldo diário')).not.toBeInTheDocument();
  });
  it('shows the three success indicators in plain language', () => {
    render(<ConsolidatedView data={data}/>);
    expect(screen.getByText('Total de Eventos Ativos')).toBeInTheDocument();
    expect(screen.getByText('Total de Pessoas Alcançadas')).toBeInTheDocument();
    expect(screen.getByText('Cliques Totais')).toBeInTheDocument();
  });
});