import { lazy, Suspense } from 'react';
import type { IntranetBI } from '@/lib/intranet';
import { moneyBR } from '@/lib/finance';
import { ChartView } from './SectorViews';
import ExecutiveSectorKpis from './ExecutiveSectorKpis';
const CashflowChart = lazy(() => import('./CashflowChart'));
const EngagementFunnelPanel = lazy(() => import('./EngagementFunnelPanel'));
const GuestAnalyticsPanel = lazy(() => import('./GuestAnalyticsPanel'));
const funnelLabels: Record<string,string> = { novo:'Novo', contato:'Em contato', proposta:'Proposta', ganho:'Ganho', perdido:'Perdido' };
export default function ConsolidatedView({ data, days = 30 }: { data: IntranetBI; days?: number }) {
  const s = data.summary;
  return <section aria-label="BI da diretoria">
    <ExecutiveSectorKpis />
    <Suspense fallback={<p className="py-8">Cruzando aberturas e conversões…</p>}><EngagementFunnelPanel days={days}/></Suspense>
    <Suspense fallback={<p className="py-8">Consolidando convidados e conversões…</p>}><GuestAnalyticsPanel days={days} mode="bi"/></Suspense>
    <dl className="grid grid-cols-1 gap-6 border-b py-7 sm:grid-cols-2 xl:grid-cols-4">{[['Receita recebida', moneyBR(s.received_cents)], ['Despesas pagas', moneyBR(s.expenses_cents)], ['Saldo do período', moneyBR(s.balance_cents)], ['Submissões no período', s.submissions], ['Novos cadastros', s.users], ['Aberturas de campanhas', s.campaign_opens], ['Negociações ganhas · total', s.won_leads], ['Atividades abertas · total', s.open_operations]].map(([label,value]) => <div key={label} className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-2 break-words text-2xl font-semibold">{value}</dd></div>)}</dl>
    <Suspense fallback={<p className="py-8">Carregando fluxo de caixa…</p>}><CashflowChart points={data.cashflow}/></Suspense>
    <div className="grid gap-x-8 lg:grid-cols-2"><ChartView title="Receita recebida por produto e plano" money points={data.sources}/><ChartView title="Funil comercial · carteira atual" points={data.funnel.map(p => ({...p,name:funnelLabels[p.name] ?? p.name}))}/><ChartView title="Submissões diárias" points={data.administration.consolidated}/><ChartView title="Novos cadastros" points={data.marketing.growth ?? []}/><ChartView title="Aberturas de campanhas por dia" points={data.traffic}/><ChartView title="Aquisição · orgânico e pago" points={data.campaigns}/><ChartView title="Campanhas vigentes por produto" points={data.commercial.inventory ?? []}/><ChartView title="Pendências por setor" points={data.operations}/></div>
    <p className="py-6 text-xs text-muted-foreground">Receitas refletem pagamentos confirmados; propostas, cortesias e permutas não aumentam o caixa. Aberturas são contadas a partir da nova coleta, não são visitantes únicos. Tráfego geral e MAU/DAU ainda não estão disponíveis.</p>
  </section>;
}