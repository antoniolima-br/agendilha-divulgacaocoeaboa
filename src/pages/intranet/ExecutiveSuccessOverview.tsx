import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck2, Eye, MousePointerClick } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { qk } from "@/data/queryKeys";
import { PUBLIC_EVENT_STATUSES, saoPauloTodayISO } from "@/lib/eventDate";
import { engagementRange, type EngagementFunnelReport } from "@/lib/engagementFunnel";
import { Button } from "@/components/ui/button";

export default function ExecutiveSuccessOverview({ days }: { days: number }) {
  const { user } = useAuth();
  const range = useMemo(() => engagementRange(days), [days]);
  const query = useQuery({
    queryKey: qk.intranet.successOverview(user?.id ?? null, range.startAt, range.endAt), enabled: !!user, refetchInterval: 30_000,
    queryFn: async () => {
      const [eventsResult, engagementResult] = await Promise.all([
        supabase.from("public_submissions").select("id", { count: "exact", head: true }).in("status", [...PUBLIC_EVENT_STATUSES]).or("moderation_status.is.null,moderation_status.neq.blocked").eq("is_archived", false).gte("event_day", saoPauloTodayISO()),
        supabase.rpc("intranet_engagement_funnel", { p_start_at: range.startAt, p_end_at: range.endAt }),
      ]);
      if (eventsResult.error) throw eventsResult.error;
      if (engagementResult.error) throw engagementResult.error;
      const engagement = engagementResult.data as unknown as EngagementFunnelReport;
      return { activeEvents: eventsResult.count ?? 0, recordedReach: engagement.summary.flyer_opens + engagement.summary.campaign_opens, totalClicks: engagement.summary.interactions };
    },
  });
  if (query.isError) return <div role="alert" className="space-y-3 py-8"><p>Não deu pra reunir os números agora.</p><Button variant="outline" className="min-h-11" onClick={() => void query.refetch()}>Tentar novamente</Button></div>;
  if (!query.data) return <p role="status" className="py-10 text-muted-foreground">Reunindo os números principais…</p>;
  const metrics = [
    { label: "Total de Eventos Ativos", value: query.data.activeEvents, Icon: CalendarCheck2 },
    { label: "Total de Pessoas Alcançadas", value: query.data.recordedReach, Icon: Eye },
    { label: "Cliques Totais", value: query.data.totalClicks, Icon: MousePointerClick },
  ];
  return <section aria-labelledby="success-overview-title" className="space-y-4 border-b py-7"><div><h2 id="success-overview-title" className="text-xl font-semibold">Resultados principais</h2><p className="mt-1 text-sm text-muted-foreground">Uma leitura rápida do que está acontecendo agora.</p></div><dl className="grid gap-3 sm:grid-cols-3">{metrics.map(({ label, value, Icon }) => <div key={label} className="min-w-0 rounded-lg border border-border bg-card p-5 shadow-sm"><dt className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Icon className="h-5 w-5 shrink-0 text-primary" />{label}</dt><dd className="mt-4 break-words text-3xl font-bold tabular-nums text-foreground">{value}</dd></div>)}</dl><p className="text-xs text-muted-foreground">Pessoas alcançadas representa aberturas registradas de flyers e campanhas; não identifica pessoas únicas.</p></section>;
}