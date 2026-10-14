import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, CalendarDays, Eye, Trophy } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { qk } from "@/data/queryKeys";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { flyerEngagementRange, formatFlyerBucket, type FlyerEngagementPeriod, type FlyerEngagementReport } from "@/lib/flyerEngagement";

const PERIODS: { value: FlyerEngagementPeriod; label: string }[] = [
  { value: "today", label: "Hoje" }, { value: "7days", label: "Últimos 7 dias" },
  { value: "month", label: "Este mês" }, { value: "custom", label: "Personalizado" },
];
const dateBR = (value: string) => new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));

export default function FlyerEngagementPanel() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<FlyerEngagementPeriod>("7days");
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const [customStart, setCustomStart] = useState(today);
  const [customEnd, setCustomEnd] = useState(today);
  const validCustom = period !== "custom" || (!!customStart && !!customEnd && customStart <= customEnd);
  const range = useMemo(() => flyerEngagementRange(period, new Date(), customStart, customEnd), [period, customStart, customEnd]);
  const query = useQuery({
    queryKey: qk.intranet.flyerEngagement(user?.id ?? null, range.startAt, range.endAt), enabled: !!user && validCustom, refetchInterval: 30_000,
    queryFn: async () => { const { data, error } = await supabase.rpc("intranet_flyer_engagement", { p_start_at: range.startAt, p_end_at: range.endAt }); if (error) throw error; return data as unknown as FlyerEngagementReport; },
  });
  const report = query.data;
  const kpis = [
    { label: "Aberturas no período", value: report?.summary.total ?? 0, icon: Eye },
    { label: "Flyer campeão", value: report?.summary.champion?.title ?? "Sem aberturas", detail: report?.summary.champion ? `${report.summary.champion.total} aberturas` : undefined, icon: Trophy },
    { label: "Média diária", value: report?.summary.daily_average ?? 0, icon: BarChart3 },
  ];

  return <div className="min-w-0 space-y-6 py-5">
    <section aria-labelledby="flyer-period-title" className="space-y-4 border-b border-border pb-6">
      <div><h2 id="flyer-period-title" className="text-xl font-semibold">Engajamento de flyers</h2><p className="mt-1 text-sm text-muted-foreground">Aberturas registradas nos detalhes de cada rolê. Atualização automática.</p></div>
      <div className="grid grid-cols-2 gap-2 lg:flex" role="group" aria-label="Período do engajamento">{PERIODS.map((item) => <Button key={item.value} variant={period === item.value ? "secondary" : "outline"} className="min-w-0" aria-pressed={period === item.value} onClick={() => setPeriod(item.value)}>{item.label}</Button>)}</div>
      {period === "custom" && <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium">De<Input type="date" value={customStart} max={customEnd || undefined} onChange={(event) => setCustomStart(event.target.value)} className="mt-1" /></label><label className="text-sm font-medium">Até<Input type="date" value={customEnd} min={customStart || undefined} onChange={(event) => setCustomEnd(event.target.value)} className="mt-1" /></label>{!validCustom && <p role="alert" className="text-sm text-destructive sm:col-span-2">Escolha um período válido para consultar.</p>}</div>}
    </section>
    {query.isError ? <div role="alert" className="space-y-3 py-8"><p>Não deu pra carregar o engajamento agora.</p><Button variant="outline" onClick={() => void query.refetch()}>Tentar novamente</Button></div> : query.isLoading ? <p className="py-10" role="status">Reunindo aberturas dos flyers…</p> : report && <>
      <dl className="grid gap-3 sm:grid-cols-3">{kpis.map(({ label, value, detail, icon: Icon }) => <div key={label} className="min-w-0 rounded-lg border border-border/80 bg-card p-4 shadow-sm"><dt className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground"><Icon className="h-4 w-4 text-primary" />{label}</dt><dd className="mt-3 break-words text-2xl font-bold text-foreground">{value}</dd>{detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}</div>)}</dl>
      <section aria-labelledby="flyer-list-title" className="min-w-0"><div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4"><div><h2 id="flyer-list-title" className="text-xl font-semibold">Flyers ativos e passados</h2><p className="mt-1 text-sm text-muted-foreground">Do maior engajamento para o menor.</p></div><Badge variant="outline">{report.items.length} flyers</Badge></div>{report.items.length === 0 ? <p className="py-10 text-sm text-muted-foreground">Nenhum flyer publicado encontrado.</p> : <ul className="divide-y divide-border">{report.items.map((item) => <li key={item.id} className="grid min-w-0 gap-4 py-5 lg:grid-cols-[minmax(0,1fr)_8rem_minmax(12rem,22rem)] lg:items-center"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="break-words font-semibold">{item.title}</h3><Badge variant="outline">{item.lifecycle === "active" ? "Ativo" : "Passado"}</Badge></div><p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" />Publicado em {dateBR(item.published_at)}</p></div><div><p className="text-xs text-muted-foreground">Aberturas</p><p className="text-2xl font-bold">{item.total}</p></div><div className="h-24 min-w-0" role="img" aria-label={`Evolução de ${item.title}: ${item.trend.map((point) => `${formatFlyerBucket(point.bucket, report.granularity)} ${point.value}`).join(", ") || "sem aberturas"}`}>{item.trend.length === 0 ? <p className="flex h-full items-center text-xs text-muted-foreground">Sem acessos no período.</p> : <ResponsiveContainer width="100%" height="100%"><LineChart data={item.trend} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}><XAxis dataKey="bucket" tickFormatter={(value) => formatFlyerBucket(String(value), report.granularity)} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" /><Tooltip labelFormatter={(value) => formatFlyerBucket(String(value), report.granularity)} formatter={(value) => [value, "Aberturas"]} contentStyle={{ background: "hsl(var(--popover))", borderColor: "hsl(var(--border))", color: "hsl(var(--popover-foreground))", borderRadius: 8 }} /><Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: "hsl(var(--primary))", r: 2 }} activeDot={{ r: 4 }} /></LineChart></ResponsiveContainer>}</div></li>)}</ul>}</section>
    </>}
  </div>;
}