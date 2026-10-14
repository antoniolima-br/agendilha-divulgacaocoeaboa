import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, Target, UserRoundCheck, Users } from "lucide-react";
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
    <div><h2 id={`guest-${mode}-title`} className="text-xl font-semibold">{mode === "marketing" ? "Aberturas por convidado" : "Leads e conversões por convidado"}</h2><p className="mt-1 text-sm text-muted-foreground">{mode === "marketing" ? "Quem abriu cada convite e o horário exato, com atualização automática." : "Origem, convite, abertura e conversão reunidos para a diretoria."}</p></div>
    <dl className="grid grid-cols-2 gap-3 xl:grid-cols-4">{metrics.map(({ label, value, Icon }) => <div key={label} className="min-w-0 rounded-lg border border-border/80 bg-card p-4 shadow-sm"><dt className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground"><Icon className="h-4 w-4 text-primary" />{label}</dt><dd className="mt-3 break-words text-2xl font-bold">{value}</dd></div>)}</dl>
    {guests.length === 0 ? <p className="py-8 text-sm text-muted-foreground">Nenhum convidado registrado neste período.</p> : <div className="overflow-x-auto rounded-md border border-border"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-muted/45 text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3">Convidado</th><th className="px-4 py-3">Rolê</th><th className="px-4 py-3">Origem</th><th className="px-4 py-3">{mode === "marketing" ? "Última abertura" : "Data do convite"}</th><th className="px-4 py-3">{mode === "marketing" ? "Aberturas" : "Conversão"}</th></tr></thead><tbody className="divide-y divide-border">{guests.map((guest) => <tr key={guest.id}><td className="px-4 py-3 font-medium">{guest.name}</td><td className="max-w-64 px-4 py-3"><span className="line-clamp-2">{guest.event_title}</span></td><td className="px-4 py-3">{GUEST_ORIGIN_LABELS[guest.origin]}</td><td className="px-4 py-3 whitespace-nowrap">{formatGuestDateTime(mode === "marketing" ? guest.last_opened_at : guest.invited_at)}</td><td className="px-4 py-3">{mode === "marketing" ? guest.opens : <Badge variant="outline">{GUEST_STATUS_LABELS[guest.status]}</Badge>}</td></tr>)}</tbody></table></div>}
  </section>;
}
