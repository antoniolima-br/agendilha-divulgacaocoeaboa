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
import { onlyDigits } from "@/lib/phone";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, Check, Plus, X } from "lucide-react";
import { formatEventDateTimeBR } from "@/lib/eventDate";

export default function AdminAprovarEventos() {
  const { canApprove, loading } = useAppPermissions();
  const decision = useCurationDecision();
  const pending = useCuration(!loading && canApprove, "pending");
  const approved = useCuration(!loading && canApprove, "approved");
  const validEvents = (list: unknown): CurationEvent[] => (Array.isArray(list) ? list.filter((e): e is CurationEvent => !!e && typeof e.id === "string") : []);
  const pendingList = validEvents(pending.data);
  const currentApproved = validEvents(approved.data).filter((event) => !!event.date && isCurrentOrFutureEventDate(event.date));

  const [rejecting, setRejecting] = useState<CurationEvent | null>(null);
  const [reason, setReason] = useState("");

  const decide = async (id: string | null | undefined, ok: boolean, why?: string) => {
    if (decision.isPending || !id || !canApprove) return false;
    try {
      await decision.mutateAsync({ id, approve: ok, reason: why });
      toast.success(ok ? "Aprovado! Eventos atuais e futuros já aparecem na agenda." : "Evento rejeitado.");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não rolou salvar. Tenta de novo.");
      return false;
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
          {e.atrativo_name && <p className="text-sm">Atração: <span className="font-medium">{e.atrativo_name}</span></p>}
          <p className="text-sm text-muted-foreground">{formatEventDateTimeBR(e.date, e.start_time)} · {e.location || "Local a confirmar"}{e.address_neighborhood ? ` · ${e.address_neighborhood}` : ""}</p>
          {(e.responsible_name || e.phone) && (
            <p className="mt-1 text-xs text-muted-foreground">
              Enviado por {e.responsible_name || "divulgador"}
              {onlyDigits(e.phone ?? "").length >= 10 && <> · <a className="font-medium text-primary underline-offset-2 hover:underline" href={`https://wa.me/55${onlyDigits(e.phone ?? "").replace(/^55(?=\d{10,11}$)/, "")}`} target="_blank" rel="noopener noreferrer">WhatsApp {e.phone}</a></>}
            </p>
          )}
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
                <Button className="min-h-12 text-base" disabled={decision.isPending} onClick={() => decide(e.id, true)}><Check className="mr-1 h-4 w-4" /> Aprovar</Button>
                <Button className="min-h-12 text-base" variant="outline" disabled={decision.isPending} onClick={() => { setReason(""); setRejecting(e); }}><X className="mr-1 h-4 w-4" /> Rejeitar</Button>
              </>))}
        </TabsContent>
        <TabsContent value="aprovados" className="space-y-3">
          {approved.isError ? <div role="alert"><p>Não deu pra carregar os aprovados.</p><Button variant="outline" onClick={() => void approved.refetch()}>Tentar novamente</Button></div> : approved.isLoading ? <LoadingState /> : currentApproved.length === 0
            ? <p className="text-sm text-muted-foreground">Nenhum rolê aprovado de hoje em diante. Envia um evento pra começar.</p>
             : currentApproved.map((e) => row(e))}
        </TabsContent>
      </Tabs>
      <Dialog open={!!rejecting} onOpenChange={(open) => { if (!open && !decision.isPending) setRejecting(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar "{rejecting?.event_title || "Rolê sem título"}"?</DialogTitle>
            <DialogDescription>O rolê não vai pro feed. Se quiser, conta o motivo pra ajudar no ajuste.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Motivo (opcional)</Label>
            <Textarea id="reject-reason" value={reason} maxLength={500} onChange={(ev) => setReason(ev.target.value)} placeholder="Ex.: flyer ilegível, data errada…" />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" disabled={decision.isPending} onClick={() => setRejecting(null)}>Voltar</Button>
            <Button variant="destructive" disabled={decision.isPending} onClick={async () => { if (rejecting && await decide(rejecting.id, false, reason)) setRejecting(null); }}><X className="mr-1 h-4 w-4" /> Confirmar rejeição</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
