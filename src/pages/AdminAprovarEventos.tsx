import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useCuration, useCurationDecision, type CurationEvent } from "@/data/useCuration";
import { ROUTES } from "@/routes/config";
import { isCurrentOrFutureEventDate } from "@/lib/eventDate";
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
  const decision = useCurationDecision();
  const today = saoPauloTodayISO();
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  const pending = useCuration(!loading && canApprove, "pending");
  const approved = useCuration(!loading && canApprove, "approved");
  const currentApproved = (approved.data ?? []).filter((event) => isCurrentOrFutureEventDate(event.date));

  useEffect(() => {
    if (!canApprove) return;
    supabase.from("app_settings").select("value").eq("key", "live_overrides").maybeSingle().then(({ data }) => {
      try { setOverrides(JSON.parse(data?.value || "{}")); } catch { setOverrides({}); }
    });
  }, [canApprove]);

  const decide = async (id: string, ok: boolean) => {
    if (decision.isPending) return;
    try {
      await decision.mutateAsync({ id, approve: ok });
      toast.success(ok ? "Aprovado! Eventos atuais e futuros já aparecem na agenda." : "Evento rejeitado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não rolou salvar. Tenta de novo.");
    }
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

  const row = (e: CurationEvent, actions: React.ReactNode) => (
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
        <h1 className="text-xl font-bold">Curadoria</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link to={ROUTES.ADMIN_ROLANDO_AGORA}><Radio className="mr-1 h-4 w-4" /> Rolando agora</Link></Button>
          <Button asChild><Link to={ROUTES.ENVIAR_EVENTO}><Plus className="mr-1 h-4 w-4" /> Enviar evento</Link></Button>
        </div>
      </div>
      <Tabs defaultValue="pendentes">
        <TabsList>
          <TabsTrigger value="pendentes">Esperando ({pending.data?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="aprovados">Aprovados ({currentApproved.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pendentes" className="space-y-3">
          {pending.isError ? <div role="alert"><p>Não deu pra carregar os envios.</p><Button variant="outline" onClick={() => void pending.refetch()}>Tentar novamente</Button></div> : pending.isLoading ? <LoadingState /> : (pending.data ?? []).length === 0
            ? <p className="text-sm text-muted-foreground">Nada esperando aprovação. Tudo em dia!</p>
            : (pending.data ?? []).map((e: any) => row(e, <>
                <Button size="sm" disabled={decision.isPending} onClick={() => decide(e.id, true)}><Check className="mr-1 h-4 w-4" /> Aprovar</Button>
                <Button size="sm" variant="outline" disabled={decision.isPending} onClick={() => decide(e.id, false)}><X className="mr-1 h-4 w-4" /> Rejeitar</Button>
              </>))}
        </TabsContent>
        <TabsContent value="aprovados" className="space-y-3">
          {approved.isError ? <div role="alert"><p>Não deu pra carregar os aprovados.</p><Button variant="outline" onClick={() => void approved.refetch()}>Tentar novamente</Button></div> : approved.isLoading ? <LoadingState /> : currentApproved.length === 0
            ? <p className="text-sm text-muted-foreground">Nenhum rolê aprovado de hoje em diante. Envia um evento pra começar.</p>
            : currentApproved.map((e: any) => row(e,
                <Button size="sm" variant={overrides[e.id] ? "default" : "outline"} onClick={() => toggleLive(e.id)}>
                  <Radio className="mr-1 h-4 w-4" /> {overrides[e.id] ? "No Rolando agora" : "Enviar pro Rolando agora"}
                </Button>))}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
