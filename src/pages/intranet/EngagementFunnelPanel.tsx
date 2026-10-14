import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Eye, Heart, Megaphone, MousePointerClick, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { qk } from "@/data/queryKeys";
import { moneyBR } from "@/lib/finance";
import { engagementRange, ENGAGEMENT_ORIGIN_LABELS, type EngagementFunnelReport } from "@/lib/engagementFunnel";
import { Button } from "@/components/ui/button";

const dateLabel = (value: string) => `${value.slice(8, 10)}/${value.slice(5, 7)}`;

export default function EngagementFunnelPanel({ days, compact = false }: { days: number; compact?: boolean }) {
  const { user } = useAuth();
  const range = useMemo(() => engagementRange(days), [days]);
  const query = useQuery({
    queryKey: qk.intranet.engagementFunnel(user?.id ?? null, range.startAt, range.endAt),
    enabled: !!user,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("intranet_engagement_funnel", { p_start_at: range.startAt, p_end_at: range.endAt });
      if (error) throw error;
      return data as unknown as EngagementFunnelReport;
    },
  });

  if (query.isError) return <div role="alert" className="space-y-3 py-8"><p>Não deu pra reunir aberturas e conversões agora.</p><Button variant="outline" onClick={() => void query.refetch()}>Tentar novamente</Button></div>;
  if (!query.data) return <p role="status" className="py-10">Cruzando aberturas, campanhas e interações…</p>;

  const { summary, daily, sources } = query.data;
  const metrics = [
    { label: "Aberturas de flyers", value: summary.flyer_opens, Icon: Eye },
    { label: "Aberturas de campanhas", value: summary.campaign_opens, Icon: Megaphone },
    { label: "Leads registrados", value: summary.leads, Icon: Users },
    { label: "Interações comprovadas", value: summary.interactions, Icon: MousePointerClick },
    { label: "Taxa de interação", value: summary.interaction_rate === null ? "Sem base" : `${summary.interaction_rate}%`, Icon: Activity },
    { label: "Favoritos", value: summary.favorites, Icon: Heart },
  ];
  const sourceRows = sources.map((row) => ({ ...row, name: ENGAGEMENT_ORIGIN_LABELS[row.source] }));

  return <section aria-labelledby="engagement-funnel-title" className="min-w-0 space-y-6 border-b border-border py-7">
    <div><h2 id="engagement-funnel-title" className="text-xl font-semibold">Aberturas, origens e conversões</h2><p className="mt-1 text-sm text-muted-foreground">Flyers, campanhas, leads e interações reais no mesmo período.</p></div>
    <dl className={`grid gap-3 ${compact ? "grid-cols-2 xl:grid-cols-3" : "grid-cols-2 lg:grid-cols-3"}`}>{metrics.map(({ label, value, Icon }) => <div key={label} className="min-w-0 rounded-lg border border-border/80 bg-card p-4 shadow-sm"><dt className="flex items-start gap-2 text-xs font-semibold uppercase text-muted-foreground"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{label}</dt><dd className="mt-3 break-words text-2xl font-bold text-foreground">{value}</dd></div>)}</dl>
    <div className="grid min-w-0 gap-6 xl:grid-cols-2">
      <section className="min-w-0"><h3 className="mb-4 font-semibold">Evolução diária</h3><div className="h-72 min-w-0 overflow-hidden" role="img" aria-label="Evolução diária de aberturas, leads e interações"><ResponsiveContainer width="100%" height="100%"><LineChart data={daily} margin={{ left: -20, right: 8 }}><CartesianGrid vertical={false} stroke="hsl(var(--border))"/><XAxis dataKey="name" tickFormatter={dateLabel} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false}/><YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}/><Tooltip labelFormatter={(value) => dateLabel(String(value))} contentStyle={{ background: "hsl(var(--popover))", borderColor: "hsl(var(--border))", color: "hsl(var(--popover-foreground))" }}/><Legend/><Line type="monotone" dataKey="flyer_opens" name="Flyers" stroke="hsl(var(--primary))" strokeWidth={3} dot={false}/><Line type="monotone" dataKey="campaign_opens" name="Campanhas" stroke="hsl(var(--accent-foreground))" strokeWidth={2} dot={false}/><Line type="monotone" dataKey="interactions" name="Interações" stroke="hsl(var(--foreground))" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer></div></section>
      <section className="min-w-0"><h3 className="mb-4 font-semibold">Resultado por origem</h3>{sourceRows.length === 0 ? <p className="flex h-72 items-center justify-center text-sm text-muted-foreground">A coleta por origem começa nas próximas aberturas.</p> : <div className="h-72 min-w-0 overflow-hidden" role="img" aria-label="Aberturas, leads e conversões por origem"><ResponsiveContainer width="100%" height="100%"><BarChart data={sourceRows} margin={{ left: -20, right: 8, bottom: 24 }}><CartesianGrid vertical={false} stroke="hsl(var(--border))"/><XAxis dataKey="name" angle={-15} textAnchor="end" height={55} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}/><YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}/><Tooltip contentStyle={{ background: "hsl(var(--popover))", borderColor: "hsl(var(--border))", color: "hsl(var(--popover-foreground))" }}/><Legend/><Bar dataKey="opens" name="Aberturas" fill="hsl(var(--primary))" radius={[4,4,0,0]}/><Bar dataKey="leads" name="Leads" fill="hsl(var(--secondary-foreground))" radius={[4,4,0,0]}/><Bar dataKey="conversions" name="Qualificados" fill="hsl(var(--foreground))" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div>}</section>
    </div>
    <div className="grid gap-2 border-t border-border pt-4 text-sm text-muted-foreground sm:grid-cols-2"><p>Investimento de Marketing registrado: <strong className="text-foreground">{moneyBR(summary.investment_cents)}</strong></p><p>Presença física: <strong className="text-foreground">sem coleta</strong>. Conversão considera favoritos e leads em proposta ou ganhos.</p></div>
  </section>;
}