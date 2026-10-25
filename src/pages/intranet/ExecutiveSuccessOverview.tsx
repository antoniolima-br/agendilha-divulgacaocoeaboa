import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck2, Eye, MousePointerClick } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { qk } from "@/data/queryKeys";
import { PUBLIC_EVENT_STATUSES, saoPauloTodayISO } from "@/lib/eventDate";
import { engagementRange, type EngagementFunnelReport } from "@/lib/engagementFunnel";
import { Button } from "@/components/ui/button";
import { MetricCard } from "./MetricCard";

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
      const sm = (engagementResult.data as unknown as EngagementFunnelReport | null)?.summary;
      const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
      return { activeEvents: eventsResult.count ?? 0, flyerOpens: n(sm?.flyer_opens), campaignOpens: n(sm?.campaign_opens), recordedReach: n(sm?.flyer_opens) + n(sm?.campaign_opens), totalClicks: n(sm?.interactions), favorites: n(sm?.favorites), leads: n(sm?.leads), qualifiedLeads: n(sm?.qualified_leads) };
    },
  });
  if (query.isError) return <div role="alert" className="space-y-3 py-8"><p>Não deu pra reunir os números agora.</p><Button variant="outline" className="min-h-11" onClick={() => void query.refetch()}>Tentar novamente</Button></div>;
  if (!query.data) return <p role="status" className="py-10 text-muted-foreground">Reunindo os números principais…</p>;
  const d = query.data;
  const metrics = [
    { label: "Total de Eventos Ativos", value: d.activeEvents, Icon: CalendarCheck2, note: "Rolês publicados de hoje em diante.", details: [{ label: "Publicados e futuros", value: d.activeEvents }] },
    { label: "Total de Pessoas Alcançadas", value: d.recordedReach, Icon: Eye, note: "Aberturas registradas; não identifica pessoas únicas.", details: [{ label: "Aberturas de flyer", value: d.flyerOpens }, { label: "Aberturas de campanha", value: d.campaignOpens }] },
    { label: "Cliques Totais", value: d.totalClicks, Icon: MousePointerClick, details: [{ label: "Interações", value: d.totalClicks }, { label: "Favoritos", value: d.favorites }, { label: "Contatos recebidos", value: d.leads }, { label: "Contatos qualificados", value: d.qualifiedLeads }] },
  ];
  return <section aria-labelledby="success-overview-title" className="space-y-3 border-b py-5"><div><h2 id="success-overview-title" className="text-xl font-semibold">Resultados principais</h2><p className="mt-1 text-sm text-muted-foreground">Uma leitura rápida do que está acontecendo agora.</p></div><div className="grid grid-cols-3 gap-2 sm:gap-3">{metrics.map((m) => <MetricCard key={m.label} {...m} />)}</div><p className="text-xs text-muted-foreground">Pessoas alcançadas representa aberturas registradas de flyers e campanhas; não identifica pessoas únicas.</p></section>;
}