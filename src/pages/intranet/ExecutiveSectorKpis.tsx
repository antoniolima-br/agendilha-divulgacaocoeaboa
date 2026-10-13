import { useState } from 'react';
import { BriefcaseBusiness, Megaphone, ShieldCheck, Wallet, Activity, Target, TrendingUp, TrendingDown, Minus, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { sectorLabels, INTRANET_SECTORS } from '@/lib/intranet';
import { saoPauloTodayISO } from '@/lib/eventDate';
import { KPI_DEFINITIONS, formatKpi, monthlyChange, kpiProgress, parseKpiTarget, type KpiKey, type SectorKpiData, type SectorKpi, type KpiDefinition } from '@/lib/sectorKpis';
import { useSectorKpis, useSaveKpiTargets } from './useSectorKpis';
import { toast } from 'sonner';

const icons = { comercial: BriefcaseBusiness, marketing: Megaphone, administracao: ShieldCheck, financeiro: Wallet, desenvolvimento: Activity };
const dayBR = (day: string) => new Date(`${day}T12:00:00-03:00`).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
const monthBR = (month: string) => new Date(`${month}-01T12:00:00-03:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' });

function KpiCard({ definition, row }: { definition: KpiDefinition; row: SectorKpi }) {
  const progress = kpiProgress(row, definition.direction);
  const change = monthlyChange(row.current, row.previous);
  const favorable = change !== null && (definition.direction === 'down' ? change < 0 : change > 0);
  const Trend = change === null || change === 0 ? Minus : change > 0 ? TrendingUp : TrendingDown;
  return <article aria-label={definition.label} className="min-w-0 rounded-lg border bg-card p-5 text-card-foreground shadow-card">
    <h4 className="min-h-10 text-sm text-muted-foreground">{definition.label}</h4>
    <p className="mt-3 break-words text-2xl font-semibold tabular-nums">{formatKpi(row.current, definition.unit)}</p>
    <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      <span className={`inline-flex items-center gap-1 font-medium ${change === null || change === 0 ? 'text-muted-foreground' : favorable ? 'text-success' : 'text-warning'}`}><Trend className="h-4 w-4 shrink-0"/>{change === null ? 'Sem base percentual' : `${change > 0 ? '+' : ''}${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(change)}%`}</span>
      <span className="text-muted-foreground">vs. mês anterior</span>
    </div>
    <p className="mt-1 text-xs text-muted-foreground">Anterior: {formatKpi(row.previous, definition.unit)}</p>
    <div className="mt-5 border-t pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs"><span className="text-muted-foreground">{definition.direction === 'down' ? 'Meta · limite máximo' : 'Meta mensal'}</span><span className="font-medium">{row.target === null ? 'Não definida' : formatKpi(row.target, definition.unit)}</span></div>
      <Progress aria-label={`Progresso de ${definition.label}`} value={progress?.value ?? 0} className={`mt-3 h-1.5 bg-muted ${progress?.met ? '[&>div]:bg-success' : '[&>div]:bg-warning'}`}/>
      <p className={`mt-2 flex items-center gap-1 text-xs ${progress?.met ? 'text-success' : 'text-muted-foreground'}`}>{progress?.met && <CheckCircle2 className="h-3.5 w-3.5"/>}{row.current === null ? 'Aguardando medição' : progress === null ? 'Defina a meta do período' : progress.met ? definition.direction === 'down' ? 'Dentro do limite' : 'Meta atingida' : definition.direction === 'down' ? 'Acima do limite · em atenção' : 'Em andamento'}</p>
    </div>
  </article>;
}

function TargetsDialog({ data, close }: { data: SectorKpiData; close: () => void }) {
  const save = useSaveKpiTargets();
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(KPI_DEFINITIONS.map(def => {
    const target = data.metrics.find(row => row.key === def.key)?.target;
    return [def.key, target == null ? '' : String(def.unit === 'money' ? (target / 100).toFixed(2) : target).replace('.', ',')];
  })));
  const [error, setError] = useState('');
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError('');
    const entries: [KpiKey, number | null][] = [];
    for (const def of KPI_DEFINITIONS) {
      const value = parseKpiTarget(values[def.key] ?? '', def.unit);
      if (value === undefined) { setError(`Confira a meta de ${def.label.toLocaleLowerCase('pt-BR')}. Use um valor válido, sem sinal negativo.`); return; }
      entries.push([def.key, value]);
    }
    try { await save.mutateAsync({ month: data.month.slice(0, 7), targets: Object.fromEntries(entries) as Record<KpiKey, number | null> }); toast.success('Metas salvas.'); close(); }
    catch { setError('Não deu pra salvar as metas. Confira seu acesso e tente de novo.'); }
  }
  return <Dialog open onOpenChange={open => { if (!open && !save.isPending) close(); }}><DialogContent><DialogHeader><DialogTitle>Metas · {monthBR(data.month.slice(0, 7))}</DialogTitle><DialogDescription>Metas mensais da diretoria. Despesas e latência têm limite máximo.</DialogDescription></DialogHeader>
    <form onSubmit={event => void submit(event)} className="space-y-5">
      {INTRANET_SECTORS.map(sector => <fieldset key={sector} className="space-y-3 border-t pt-4"><legend className="px-1 text-sm font-semibold">{sectorLabels[sector]}</legend>{KPI_DEFINITIONS.filter(def => def.sector === sector).map(def => <div key={def.key}><Label htmlFor={`target-${def.key}`} className="text-xs">{def.label}{def.unit === 'money' ? ' (R$)' : def.unit === 'ms' ? ' (ms)' : ''}</Label><Input id={`target-${def.key}`} inputMode={def.unit === 'count' ? 'numeric' : 'decimal'} value={values[def.key]} disabled={save.isPending} placeholder="Não definida" onChange={event => setValues(old => ({ ...old, [def.key]: event.target.value }))} className="mt-1"/></div>)}</fieldset>)}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <DialogFooter><Button type="button" variant="outline" disabled={save.isPending} onClick={close}>Cancelar</Button><Button type="submit" disabled={save.isPending}>{save.isPending ? 'Salvando…' : 'Salvar metas'}</Button></DialogFooter>
    </form></DialogContent></Dialog>;
}

export default function ExecutiveSectorKpis() {
  const currentMonth = saoPauloTodayISO().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [editing, setEditing] = useState(false);
  const query = useSectorKpis(month);
  const data = query.data;
  return <section aria-labelledby="sector-kpis-title" className="border-b py-8">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><h2 id="sector-kpis-title" className="text-xl font-semibold">Painel Executivo de KPIs por Setor</h2><p className="mt-1 text-sm text-muted-foreground">{monthBR(month)} · resultados e metas mensais</p></div><div className="flex flex-wrap items-center gap-2"><Input type="month" aria-label="Mês dos KPIs" value={month} max={currentMonth} className="w-44" onChange={event => { if (/^\d{4}-\d{2}$/.test(event.target.value) && event.target.value <= currentMonth) setMonth(event.target.value); }}/><Button variant="outline" disabled={!data || query.isError} onClick={() => setEditing(true)}><Target className="mr-2 h-4 w-4"/>Definir metas</Button><Button variant="ghost" size="icon" title="Atualizar KPIs" aria-label="Atualizar KPIs" disabled={query.isFetching} onClick={() => void query.refetch()}><RefreshCw className={`h-4 w-4 ${query.isFetching ? 'animate-spin' : ''}`}/></Button></div></header>
    {query.isError ? <div role="alert" className="py-8"><p>Não deu pra carregar os KPIs. Tente de novo.</p><Button variant="outline" className="mt-3" onClick={() => void query.refetch()}>Tentar novamente</Button></div> : !data ? <p role="status" className="py-8 text-muted-foreground">Reunindo resultados dos setores…</p> : <>
      <p className="mt-4 text-xs text-muted-foreground">{dayBR(data.month)} a {dayBR(data.through)} · comparação: {dayBR(data.previous_from)} a {dayBR(data.previous_through)}. Atualizado às {new Date(data.as_of).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })}.</p>
      <div className="space-y-7 pt-6">{INTRANET_SECTORS.map(sector => { const Icon = icons[sector]; return <section key={sector} aria-label={`KPIs de ${sectorLabels[sector]}`}><h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Icon className="h-4 w-4 text-primary"/>{sectorLabels[sector]}</h3><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{KPI_DEFINITIONS.filter(def => def.sector === sector).map(def => <KpiCard key={def.key} definition={def} row={data.metrics.find(row => row.key === def.key) ?? { key: def.key, current: null, previous: null, target: null }}/>)}</div></section>; })}</div>
      <p className="mt-6 text-xs text-muted-foreground">Comparação entre dias equivalentes de cada mês; metas para o mês inteiro. Aberturas não são visitantes únicos. Latência usa apenas medições manuais registradas.</p>
      {editing && <TargetsDialog data={data} close={() => setEditing(false)}/>}
    </>}
  </section>;
}