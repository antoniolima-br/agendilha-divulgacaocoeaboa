import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer } from "@/components/ui/PageContainer";
import { LoadingState } from "@/components/ui/LoadingState";
import { toast } from "sonner";
import { Check, Plus, Radio, X } from "lucide-react";
import { formatEventDateTimeBR, saoPauloTodayISO, PUBLIC_EVENT_STATUSES } from "@/lib/eventDate";

const FIELDS = "id, event_title, date, start_time, end_time, location, status, image_url, category";

export default function AdminAprovarEventos() {
  const { canApprove, loading } = useAppPermissions();
  const qc = useQueryClient();
  const today = saoPauloTodayISO();
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  const pending = useQuery({
    queryKey: ["admin", "aprovar", "pendentes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("submissions").select(FIELDS)
        .eq("status", "pendente").is("deleted_at", null).order("date");
      if (error) throw error;
      return data ?? [];
    },
  });

  const approved = useQuery({
    queryKey: ["admin", "aprovar", "aprovados", today],
    queryFn: async () => {
      const { data, error } = await supabase.from("submissions").select(FIELDS)
        .in("status", [...PUBLIC_EVENT_STATUSES]).is("deleted_at", null)
        .gte("date", today).order("date").limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    supabase.from("app_settings").select("value").eq("key", "live_overrides").maybeSingle().then(({ data }) => {
      try { setOverrides(JSON.parse(data?.value || "{}")); } catch { setOverrides({}); }
    });
  }, []);

  const decide = async (id: string, ok: boolean) => {
    const { data: u } = await supabase.auth.getUser();
    const now = new Date().toISOString();
    const patch = ok
      ? { status: "aprovado", approved_at: now, approved_by: u.user?.id }
      : { status: "rejeitado", rejected_at: now, rejected_by: u.user?.id };
    const { error } = await supabase.from("submissions").update(patch as any).eq("id", id);
    if (error) return toast.error("Não rolou salvar. Tenta de novo.");
    toast.success(ok ? "Aprovado! Já aparece na Home e na agenda." : "Evento recusado.");
    qc.invalidateQueries({ queryKey: ["admin", "aprovar"] });
  };

  const toggleLive = async (id: string) => {
    const next = { ...overrides };
    if (next[id]) delete next[id]; else next[id] = true;
    const { error } = await supabase.from("app_settings").update({ value: JSON.stringify(next) }).eq("key", "live_overrides");
    if (error) return toast.error("Não rolou salvar. Tenta de novo.");
    setOverrides(next);
    toast.success(next[id] ? "Mandado pro Rolando agora! 🔴" : "Tirado do Rolando agora.");
  };

  if (loading) return <LoadingState />;
  if (!canApprove) return <Navigate to="/" replace />;

  const row = (e: any, actions: React.ReactNode) => (
    <Card key={e.id}>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        {e.image_url && <img src={e.image_url} alt="" className="h-20 w-20 shrink-0 rounded-md object-cover" />}
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{e.event_title || "Rolê sem título"}</p>
          <p className="text-sm text-muted-foreground">{formatEventDateTimeBR(e.date, e.start_time)} · {e.location || "Local a confirmar"}</p>
        </div>
        <div className="flex flex-wrap gap-2">{actions}</div>
      </CardContent>
    </Card>
  );

  return (
    <PageContainer>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">Aprovar eventos</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link to="/admin/rolando-agora"><Radio className="mr-1 h-4 w-4" /> Rolando agora</Link></Button>
          <Button asChild><Link to="/enviar-evento"><Plus className="mr-1 h-4 w-4" /> Enviar evento</Link></Button>
        </div>
      </div>
      <Tabs defaultValue="pendentes">
        <TabsList>
          <TabsTrigger value="pendentes">Esperando ({pending.data?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="aprovados">Aprovados ({approved.data?.length ?? 0})</TabsTrigger>
        </TabsList>
        <TabsContent value="pendentes" className="space-y-3">
          {pending.isLoading ? <LoadingState /> : (pending.data ?? []).length === 0
            ? <p className="text-sm text-muted-foreground">Nada esperando aprovação. Tudo em dia!</p>
            : (pending.data ?? []).map((e: any) => row(e, <>
                <Button size="sm" onClick={() => decide(e.id, true)}><Check className="mr-1 h-4 w-4" /> Aprovar</Button>
                <Button size="sm" variant="outline" onClick={() => decide(e.id, false)}><X className="mr-1 h-4 w-4" /> Recusar</Button>
              </>))}
        </TabsContent>
        <TabsContent value="aprovados" className="space-y-3">
          {approved.isLoading ? <LoadingState /> : (approved.data ?? []).length === 0
            ? <p className="text-sm text-muted-foreground">Nenhum rolê aprovado de hoje em diante. Envia um evento pra começar.</p>
            : (approved.data ?? []).map((e: any) => row(e,
                <Button size="sm" variant={overrides[e.id] ? "default" : "outline"} onClick={() => toggleLive(e.id)}>
                  <Radio className="mr-1 h-4 w-4" /> {overrides[e.id] ? "No Rolando agora" : "Enviar pro Rolando agora"}
                </Button>))}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
