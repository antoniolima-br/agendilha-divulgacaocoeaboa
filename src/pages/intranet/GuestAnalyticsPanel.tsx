import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, MessageCircle, Target, UserRoundCheck, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { qk } from "@/data/queryKeys";
import { curationImpactRange } from "@/lib/curationImpact";
import { formatGuestDateTime, GUEST_ORIGIN_LABELS, GUEST_STATUS_LABELS, type GuestAnalyticsReport } from "@/lib/eventGuests";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function GuestAnalyticsPanel({ days, mode }: { days: number; mode: "marketing" | "bi" }) {
  const { user } = useAuth();
  const range = useMemo(() => curationImpactRange(days), [days]);
  const query = useQuery({
    queryKey: qk.intranet.guestAnalytics(user?.id ?? null, range.startAt, range.endAt),
    enabled: !!user,
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("intranet_guest_analytics", { p_start_at: range.startAt, p_end_at: range.endAt });
      if (error) throw error;
      return data as unknown as GuestAnalyticsReport;
    },
  });

  if (query.isError) return <div role="alert" className="space-y-3 py-8"><p>Não deu pra reunir os convidados agora.</p><Button variant="outline" onClick={() => void query.refetch()}>Tentar novamente</Button></div>;
  if (!query.data) return <p role="status" className="py-10">Reunindo convidados e convites…</p>;

  const { summary, guests } = query.data;
  const metrics = [
    { label: "Convidados", value: summary.guests, Icon: Users },
    { label: "Abriram", value: summary.opened, Icon: Eye },
    { label: "Convertidos", value: summary.converted, Icon: UserRoundCheck },
    { label: mode === "marketing" ? "Taxa de abertura" : "Taxa de conversão", value: `${(mode === "marketing" ? summary.open_rate : summary.conversion_rate) ?? 0}%`, Icon: Target },
  ];

  return <section aria-labelledby={`guest-${mode}-title`} className="min-w-0 space-y-5 border-b border-border py-7">
    <div><h2 id={`guest-${mode}-title`} className="text-xl font-semibold">Convidados e parceiros</h2><p className="mt-1 text-sm text-muted-foreground">Nome, contato e resposta de cada convite em uma leitura rápida.</p></div>
    <dl className="grid grid-cols-2 gap-3 xl:grid-cols-4">{metrics.map(({ label, value, Icon }) => <div key={label} className="min-w-0 rounded-lg border border-border/80 bg-card p-4 shadow-sm"><dt className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground"><Icon className="h-4 w-4 text-primary" />{label}</dt><dd className="mt-3 break-words text-2xl font-bold">{value}</dd></div>)}</dl>
    {guests.length === 0 ? <p className="py-8 text-sm text-muted-foreground">Nenhum convidado registrado neste período.</p> : <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{guests.map((guest) => <li key={guest.id} className="min-w-0 rounded-lg border border-border bg-card p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-2"><h3 className="break-words font-semibold">{guest.name}</h3><Badge variant="outline">{GUEST_STATUS_LABELS[guest.status]}</Badge></div><p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{guest.event_title}</p><div className="mt-4 space-y-2 border-t pt-4 text-sm"><p className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-primary"/><span className="break-all">{guest.whatsapp || "WhatsApp não informado"}</span></p><p><span className="text-muted-foreground">Origem:</span> {GUEST_ORIGIN_LABELS[guest.origin]}</p><p><span className="text-muted-foreground">Status:</span> {guest.opens > 0 ? `${guest.opens} ${guest.opens === 1 ? "abertura" : "aberturas"} · ${formatGuestDateTime(guest.last_opened_at)}` : "Ainda não abriu"}</p></div></li>)}</ul>}
  </section>;
}
