import { lazy, Suspense } from 'react';
import type { IntranetBI } from '@/lib/intranet';
import { moneyBR } from '@/lib/finance';
import ExecutiveSuccessOverview from './ExecutiveSuccessOverview';
const CashflowChart = lazy(() => import('./CashflowChart'));
export default function ConsolidatedView({ data, days = 30 }: { data: IntranetBI; days?: number }) {
  const s = data.summary;
  return <section aria-label="Visão geral da diretoria">
    <ExecutiveSuccessOverview days={days}/>
    <section aria-labelledby="finance-summary-title" className="space-y-4 border-b py-7"><div><h2 id="finance-summary-title" className="text-xl font-semibold">Resumo financeiro</h2><p className="mt-1 text-sm text-muted-foreground">Somente valores já confirmados no período.</p></div><dl className="grid gap-3 sm:grid-cols-3">{[['Receita recebida', moneyBR(s.received_cents)], ['Despesas pagas', moneyBR(s.expenses_cents)], ['Saldo do período', moneyBR(s.balance_cents)]].map(([label,value]) => <div key={label} className="min-w-0 rounded-lg border border-border bg-card p-5 shadow-sm"><dt className="text-sm text-muted-foreground">{label}</dt><dd className="mt-3 break-words text-2xl font-semibold">{value}</dd></div>)}</dl></section>
    <Suspense fallback={<p className="py-8">Carregando fluxo de caixa…</p>}><CashflowChart points={data.cashflow}/></Suspense>
    <p className="py-6 text-xs text-muted-foreground">Receitas refletem pagamentos confirmados; propostas, cortesias e permutas não aumentam o caixa.</p>
  </section>;
}