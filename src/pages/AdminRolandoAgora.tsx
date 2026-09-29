import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageContainer } from "@/components/ui/PageContainer";
import { LoadingState } from "@/components/ui/LoadingState";
import { toast } from "sonner";
import { Plus, Radio } from "lucide-react";
import { saoPauloTodayISO, PUBLIC_EVENT_STATUSES } from "@/lib/eventDate";

type Override = "on" | "off" | "auto";

function nowHHMM() {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
}

export function isLiveByTime(start?: string | null, end?: string | null) {
  if (!start) return false;
  const n = nowHHMM();
  const s = start.slice(0, 5);
  const e = (end || "23:59").slice(0, 5);
  return e > s ? n >= s && n <= e : n >= s || n <= e;
}

export default function AdminRolandoAgora() {
  const { isAdmin, loading } = useAppPermissions() as any;
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const today = saoPauloTodayISO();

  const events = useQuery({
    queryKey: ["admin", "rolando-agora", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("id, event_title, date, start_time, end_time, location, status")
        .in("status", [...PUBLIC_EVENT_STATUSES])
        .gte("date", today)
        .lte("date", today + "T23:59:59")
        .order("start_time");
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    supabase.from("app_settings").select("value").eq("key", "live_overrides").maybeSingle().then(({ data }) => {
      try { setOverrides(JSON.parse(data?.value || "{}")); } catch { setOverrides({}); }
    });
  }, []);

  const setMode = async (id: string, mode: Override) => {
    const next = { ...overrides };
    if (mode === "auto") delete next[id]; else next[id] = mode === "on";
    const { error } = await supabase.from("app_settings").update({ value: JSON.stringify(next) }).eq("key", "live_overrides");
    if (error) return toast.error("Não rolou salvar. Tenta de novo.");
    setOverrides(next);
    toast.success("Salvo! O Guia do Koé já sabe.");
  };

  if (loading) return <LoadingState />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <PageContainer>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="flex items-center gap-2 text-xl font-bold"><Radio className="h-5 w-5 text-primary" /> Rolando agora</h1>
        <Button asChild><Link to="/enviar-evento"><Plus className="mr-1 h-4 w-4" /> Enviar evento</Link></Button>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Eventos aprovados de hoje. Pelo horário, eles viram "rolando agora" sozinhos. Se precisar, force ligado ou desligado.
      </p>
      {events.isLoading ? <LoadingState /> : (events.data ?? []).length === 0 ? (
        <p className="text-sm">Nenhum rolê aprovado pra hoje. Envia um evento e aprova na Gestão de Eventos.</p>
      ) : (
        <div className="space-y-3">
          {(events.data ?? []).map((e: any) => {
            const ov = overrides[e.id];
            const mode: Override = ov === undefined ? "auto" : ov ? "on" : "off";
            const live = ov ?? isLiveByTime(e.start_time, e.end_time);
            return (
              <Card key={e.id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">{e.event_title || "Rolê sem título"}</p>
                    <p className="text-sm text-muted-foreground">{e.start_time || "--"}{e.end_time ? ` às ${e.end_time}` : ""} · {e.location}</p>
                    <p className={live ? "text-sm font-semibold text-primary" : "text-sm text-muted-foreground"}>{live ? "🔴 Rolando agora" : "Ainda não tá rolando"}</p>
                  </div>
                  <div className="flex gap-1">
                    {(["auto", "on", "off"] as Override[]).map((m) => (
                      <Button key={m} size="sm" variant={mode === m ? "default" : "outline"} onClick={() => setMode(e.id, m)}>
                        {m === "auto" ? "Automático" : m === "on" ? "Ligado" : "Desligado"}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
