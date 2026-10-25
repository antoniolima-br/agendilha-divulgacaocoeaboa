import type { IntranetBI } from '@/lib/intranet';
import { moneyBR } from '@/lib/finance';
import ExecutiveSuccessOverview from './ExecutiveSuccessOverview';
import { MetricCard } from './MetricCard';
export default function ConsolidatedView({ data, days = 30 }: { data: IntranetBI; days?: number }) {
  const s = data?.summary ?? { received_cents: 0, expenses_cents: 0, balance_cents: 0 };
  const flow = Array.isArray(data?.cashflow) ? data.cashflow.filter(Boolean) : [];
  const money = (c: unknown) => moneyBR(typeof c === 'number' ? c : 0);
  const byMonth = (pick: (f: { revenue: number; expenses: number }) => number) => flow.map((f) => ({ label: f.name, value: money(pick(f)) }));
  return <section aria-label="Visão geral da diretoria">
    <ExecutiveSuccessOverview days={days}/>
    <section aria-labelledby="finance-summary-title" className="space-y-3 border-b py-5"><div><h2 id="finance-summary-title" className="text-xl font-semibold">Resumo financeiro</h2><p className="mt-1 text-sm text-muted-foreground">Somente valores já confirmados no período.</p></div><div className="grid grid-cols-3 gap-2 sm:gap-3">
      <MetricCard label="Receita recebida" value={money(s.received_cents)} details={byMonth((f) => f.revenue)} note="Pagamentos confirmados, mês a mês." />
      <MetricCard label="Despesas pagas" value={money(s.expenses_cents)} details={byMonth((f) => f.expenses)} note="Saídas já pagas, mês a mês." />
      <MetricCard label="Saldo do período" value={money(s.balance_cents)} details={byMonth((f) => (f.revenue ?? 0) - (f.expenses ?? 0))} note="Receita menos despesas, mês a mês." />
    </div></section>
    <p className="py-6 text-xs text-muted-foreground">Receitas refletem pagamentos confirmados; propostas, cortesias e permutas não aumentam o caixa.</p>
  </section>;
}