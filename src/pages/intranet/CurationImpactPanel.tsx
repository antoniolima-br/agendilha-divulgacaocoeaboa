import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, Heart, Loader2, RefreshCw, TrendingUp, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { qk } from "@/data/queryKeys";
import {
  CURATION_ACTIVITY_LABELS,
  CURATION_CHANNEL_LABELS,
  curationImpactRange,
  formatCurationActivityDate,
  type CurationImpactEvent,
  type CurationImpactReport,
} from "@/lib/curationImpact";
import { formatEventDateTimeBR } from "@/lib/eventDate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function useCurationImpact(days: number) {
  const { user } = useAuth();
  const range = useMemo(() => curationImpactRange(days), [days]);
  return useQuery({
    queryKey: qk.intranet.curationImpact(user?.id ?? null, range.startAt, range.endAt),
    enabled: !!user,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("intranet_curation_impact", { p_start_at: range.startAt, p_end_at: range.endAt });
      if (error) throw error;
      return data as unknown as CurationImpactReport;
    },
  });
}

export function EventImpactCounters({ impact }: { impact?: CurationImpactEvent }) {
  const values = [
    { label: "Aberturas", value: impact?.opens ?? 0, Icon: Eye },
    { label: "Favoritos", value: impact?.favorites ?? 0, Icon: Heart },
    { label: "Conversões", value: impact?.conversions ?? 0, Icon: TrendingUp },
  ];
  return <dl className="mt-3 grid grid-cols-3 gap-2">{values.map(({ label, value, Icon }) => <div key={label} className="min-w-0 rounded-md border border-border/80 bg-card px-2 py-2 text-center"><dt className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground"><Icon className="h-3 w-3 shrink-0 text-primary" />{label}</dt><dd className="mt-1 text-lg font-bold text-foreground">{value}</dd></div>)}</dl>;
}

export default function CurationImpactPanel() {
  const [days, setDays] = useState(30);
  const query = useCurationImpact(days);
  const report = query.data;
  const eventNames = useMemo(() => new Map((report?.events ?? []).map((event) => [event.id, event.title])), [report?.events]);

  return <section className="min-w-0 space-y-5 py-4" aria-labelledby="curation-impact-title">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><h3 id="curation-impact-title" className="text-lg font-semibold">Impacto da divulgação</h3><p className="mt-1 text-sm text-muted-foreground">Aberturas reais por rolê e pelo canal usado na divulgação.</p></div>
      <div className="flex items-center gap-2"><div className="grid grid-cols-3 rounded-md border border-border p-1">{[7, 30, 90].map((value) => <Button key={value} type="button" size="sm" variant={days === value ? "default" : "ghost"} onClick={() => setDays(value)}>{value} dias</Button>)}</div><Button type="button" size="icon" variant="outline" aria-label="Atualizar impacto" title="Atualizar" onClick={() => void query.refetch()} disabled={query.isFetching}>{query.isFetching ? <Loader2 className="animate-spin" /> : <RefreshCw />}</Button></div>
    </header>

    {query.isError ? <div role="alert" className="space-y-3 border-y py-8"><p>Não deu pra reunir o impacto agora.</p><Button variant="outline" onClick={() => void query.refetch()}>Tentar novamente</Button></div> : !report ? <p role="status" className="py-10">Atualizando o impacto dos rolês…</p> : <>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {([
          ["Aberturas", report.summary.opens, Eye],
          ["Favoritos", report.summary.favorites, Heart],
          ["Leads", report.summary.leads, Users],
          ["Conversões", report.summary.conversions, TrendingUp],
        ] as Array<[string, number, LucideIcon]>).map(([label, value, Icon]) => <div key={label} className="rounded-md border border-border bg-card p-4"><dt className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground"><Icon className="h-4 w-4 text-primary" />{label}</dt><dd className="mt-2 text-3xl font-bold text-foreground">{value}</dd></div>)}
      </dl>

      <Tabs defaultValue="events" className="min-w-0">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto"><TabsTrigger value="events">Por rolê</TabsTrigger><TabsTrigger value="flow">Fluxo de leads</TabsTrigger></TabsList>
        <TabsContent value="events" className="pt-3">
          {report.events.length === 0 ? <p className="py-8 text-sm text-muted-foreground">As métricas aparecem quando os rolês começarem a receber acessos.</p> : <ul className="divide-y border-y">{report.events.map((event) => <li key={event.id} className="py-5"><div className="flex min-w-0 gap-3">{event.image_url ? <img src={event.image_url} alt="" width={64} height={80} loading="lazy" decoding="async" className="h-20 w-16 shrink-0 rounded-md object-cover" /> : null}<div className="min-w-0 flex-1"><h4 className="break-words font-semibold">{event.title}</h4><p className="text-sm text-muted-foreground">{formatEventDateTimeBR(event.event_date, event.start_time)}</p><div className="mt-3 flex flex-wrap gap-2">{Object.entries(event.channels).filter(([, count]) => count > 0).map(([channel, count]) => <Badge key={channel} variant="outline">{CURATION_CHANNEL_LABELS[channel as keyof typeof CURATION_CHANNEL_LABELS]} · {count}</Badge>)}</div></div></div><EventImpactCounters impact={event} /></li>)}</ul>}
        </TabsContent>
        <TabsContent value="flow" className="pt-3">
          {report.activity.length === 0 ? <p className="py-8 text-sm text-muted-foreground">O fluxo aparece conforme houver aberturas, favoritos e leads ligados aos rolês.</p> : <ul className="divide-y border-y">{report.activity.map((item, index) => <li key={`${item.event_id}-${item.occurred_at}-${index}`} className="grid min-w-0 gap-1 py-4 sm:grid-cols-[minmax(0,1fr)_auto]"><div className="min-w-0"><p className="break-words font-medium">{CURATION_ACTIVITY_LABELS[item.kind]} · {eventNames.get(item.event_id) ?? "Rolê"}</p><p className="break-words text-sm text-muted-foreground">{item.person}{item.detail ? ` · ${item.detail}` : ""} · {item.source}</p></div><time className="text-xs text-muted-foreground sm:text-right" dateTime={item.occurred_at}>{formatCurationActivityDate(item.occurred_at)}</time></li>)}</ul>}
        </TabsContent>
      </Tabs>
      <p className="text-xs text-muted-foreground">Aberturas e favoritos preservam a identidade da pessoa. Dados de contato aparecem somente em leads registrados pela equipe.</p>
    </>}
  </section>;
}