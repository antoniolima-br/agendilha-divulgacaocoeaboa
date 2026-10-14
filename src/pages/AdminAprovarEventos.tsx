import { Link, Navigate } from "react-router-dom";
import { useCuration, useCurationDecision, type CurationEvent } from "@/data/useCuration";
import { ROUTES } from "@/routes/config";
import { isCurrentOrFutureEventDate } from "@/lib/eventDate";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer } from "@/components/ui/PageContainer";
import { LoadingState } from "@/components/ui/LoadingState";
import { toast } from "sonner";
import { AlertCircle, Check, Plus, X } from "lucide-react";
import { formatEventDateTimeBR } from "@/lib/eventDate";

export default function AdminAprovarEventos() {
  const { canApprove, loading } = useAppPermissions();
  const decision = useCurationDecision();
  const pending = useCuration(!loading && canApprove, "pending");
  const approved = useCuration(!loading && canApprove, "approved");
  const currentApproved = (approved.data ?? []).filter((event) => isCurrentOrFutureEventDate(event.date));

  const decide = async (id: string, ok: boolean) => {
    if (decision.isPending) return;
    try {
      await decision.mutateAsync({ id, approve: ok });
      toast.success(ok ? "Aprovado! Eventos atuais e futuros já aparecem na agenda." : "Evento rejeitado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não rolou salvar. Tenta de novo.");
    }
  };

  if (loading) return <LoadingState />;
  if (!canApprove) return <Navigate to="/" replace />;

  const row = (e: CurationEvent, actions?: React.ReactNode) => (
    <Card key={e.id}>
      <CardContent className="flex flex-col gap-4 p-3 sm:p-5">
        {e.image_url ? <div className="flex min-h-[26rem] items-center justify-center overflow-hidden rounded-md border bg-background/40 sm:min-h-[38rem]"><img src={e.image_url} alt={`Flyer de ${e.event_title || "rolê"}`} loading="lazy" decoding="async" className="max-h-[80vh] w-full object-contain" /></div> : null}
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{e.event_title || "Rolê sem título"}</p>
          {e.responsible_name && <p className="text-xs text-muted-foreground">Enviado por {e.responsible_name}</p>}
          <p className="text-sm text-muted-foreground">{formatEventDateTimeBR(e.date, e.start_time)} · {e.location || "Local a confirmar"}</p>
          {!e.event_title?.trim() && <p role="alert" className="mt-3 flex items-start gap-2 rounded-md border border-primary/40 bg-primary/5 p-3 text-sm"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Preencha o título antes de aprovar este rolê.</p>}
        </div>
        {actions && <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">{actions}</div>}
      </CardContent>
    </Card>
  );

  return (
    <PageContainer>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">Curadoria</h1>
        <div className="flex gap-2">
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
             : (pending.data ?? []).map((e) => row(e, <>
                <Button className="min-h-12 text-base" disabled={decision.isPending || !e.event_title?.trim()} onClick={() => decide(e.id, true)}><Check className="mr-1 h-4 w-4" /> Aprovar</Button>
                <Button className="min-h-12 text-base" variant="outline" disabled={decision.isPending} onClick={() => decide(e.id, false)}><X className="mr-1 h-4 w-4" /> Rejeitar</Button>
              </>))}
        </TabsContent>
        <TabsContent value="aprovados" className="space-y-3">
          {approved.isError ? <div role="alert"><p>Não deu pra carregar os aprovados.</p><Button variant="outline" onClick={() => void approved.refetch()}>Tentar novamente</Button></div> : approved.isLoading ? <LoadingState /> : currentApproved.length === 0
            ? <p className="text-sm text-muted-foreground">Nenhum rolê aprovado de hoje em diante. Envia um evento pra começar.</p>
             : currentApproved.map((e) => row(e))}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
