import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { useMyEventHistory } from "@/data/useMyEventHistory";
import { isArchivedEvent } from "@/lib/eventArchive";
import { ROUTES } from "@/routes/config";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { EditarMeuEventoDialog, type EventoEditavel } from "@/components/divulgador/EditarMeuEventoDialog";
import { Pencil, Lock, Archive, Eye, Repeat2, Share2, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  Loader2,
  PlusCircle,
  ShieldCheck,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { formatBrazilianDate } from "@/lib/date-utils";
import { ShareOwnEventDialog } from "@/components/divulgador/ShareOwnEventDialog";
import { canEditOwnEvent, organizerStatus } from "@/lib/organizerEventAccess";
import type { PromoterShareEvent } from "@/lib/promoterEventSharing";
import { useMyEventClicks } from "@/data/useMyEventClicks";
import { useDivulgadorStatus } from "@/data/useDivulgadorStatus";
import { LoadingState } from "@/components/ui/LoadingState";

type StatusKey = "todos" | "pendente" | "aprovado" | "rejeitado" | "suspenso" | "arquivados";

interface Row {
  id: string;
  event_title: string;
  date: string | null;
  start_time: string | null;
  status: string;
  rejection_reason: string | null;
  admin_notes: string | null;
  approved_at: string | null;
  image_url: string | null;
  slug: string | null;
  created_at: string;
  end_time: string | null;
  location: string | null;
  description: string | null;
  user_id: string;
}

function StatusBadge({ status, approvedAt }: { status: string; approvedAt?: string | null }) {
  const label = status === "Arquivado" ? status : organizerStatus(status, approvedAt);
  const Icon = label === "Aprovado" ? ShieldCheck : label === "Suspenso" || label === "Rejeitado" ? XCircle : Clock;
  return <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-semibold text-foreground"><Icon className="h-3.5 w-3.5 shrink-0" />{label}</span>;
}

export default function MeusEventos() {
  const { user } = useAuth();
  const [tab, setTab] = useState<StatusKey>("todos");
  const { isDivulgador } = useDivulgadorStatus();
  const { canSubmit } = useAppPermissions();
  const [sharing, setSharing] = useState<PromoterShareEvent | null>(null);
  const { data: clickCounts = {} } = useMyEventClicks();
  const [editing, setEditing] = useState<EventoEditavel | null>(null);
  const [viewing, setViewing] = useState<Row | null>(null);
  const navigate = useNavigate();

  const { data: history = [], isLoading: loading, isError, refetch } = useMyEventHistory(user?.id);
  const rows = useMemo(() => history.filter((row) => !!user && row.user_id === user.id), [history, user]);

  const counts = useMemo(() => {
    const c = { todos: 0, pendente: 0, aprovado: 0, rejeitado: 0, suspenso: 0, arquivados: 0 } as Record<StatusKey, number>;
    rows.forEach((r) => {
      if (isArchivedEvent(r.date)) { c.arquivados++; return; }
      c.todos++;
      if (organizerStatus(r.status, r.approved_at) === "Suspenso") c.suspenso++;
      else if (["pendente", "pending", "rascunho", "draft", "em_revisao", "recebido"].includes(r.status)) c.pendente++;
      else if (["aprovado", "publicado", "divulgado"].includes(r.status)) c.aprovado++;
      else if (r.status === "rejeitado") c.rejeitado++;
    });
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    if (tab === "arquivados") return rows.filter((r) => isArchivedEvent(r.date));
    const active = rows.filter((r) => !isArchivedEvent(r.date));
    if (tab === "todos") return active;
    if (tab === "suspenso") return active.filter((r) => organizerStatus(r.status, r.approved_at) === "Suspenso");
    if (tab === "pendente") return active.filter((r) => canEditOwnEvent(r) && r.status !== "rejeitado");
    if (tab === "aprovado")
      return active.filter((r) => ["aprovado", "publicado", "divulgado"].includes(r.status));
    return active.filter((r) => r.status === tab && organizerStatus(r.status, r.approved_at) !== "Suspenso");
  }, [rows, tab]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14 space-y-8">
        <header data-organizer-header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-foreground/12 bg-foreground/[0.02] mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Painel pessoal · Divulgador
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">
              Meus eventos
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Área do Divulgador
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
          <Button asChild variant="outline" className="min-h-11"><Link to={ROUTES.COMPARTILHAR_MEUS_EVENTOS}><Share2 className="mr-2 h-4 w-4" />Compartilhar meus eventos</Link></Button>
          {canSubmit && (
            <Button
              asChild
              className="min-h-11 w-full font-semibold sm:w-auto"
            >
              <Link to={ROUTES.ENVIAR_EVENTO}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Publicar novo evento
              </Link>
            </Button>
          )}
          </div>
        </header>

        {/* Card removido daqui pois agora temos a página /divulgador/status dedicada e linkada nos botões principais */}

        <Tabs value={tab} onValueChange={(v) => setTab(v as StatusKey)} className="min-w-0">
          <div className="-mx-4 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:px-0">
          <TabsList className="w-max bg-foreground/[0.04] rounded-full p-1">
            <TabsTrigger value="todos" className="shrink-0 rounded-full px-4">
              Todos <span className="ml-1.5 opacity-60">{counts.todos}</span>
            </TabsTrigger>
            <TabsTrigger value="pendente" className="shrink-0 rounded-full px-4">
              Aguardando aprovação <span className="ml-1.5 opacity-60">{counts.pendente}</span>
            </TabsTrigger>
            <TabsTrigger value="aprovado" className="shrink-0 rounded-full px-4">
              Publicados <span className="ml-1.5 opacity-60">{counts.aprovado}</span>
            </TabsTrigger>
            <TabsTrigger value="rejeitado" className="shrink-0 rounded-full px-4">
              Rejeitados <span className="ml-1.5 opacity-60">{counts.rejeitado}</span>
            </TabsTrigger>
            <TabsTrigger value="suspenso" className="shrink-0 rounded-full px-4">Suspensos <span className="ml-1.5 opacity-60">{counts.suspenso}</span></TabsTrigger>
            <TabsTrigger value="arquivados" className="shrink-0 rounded-full px-4">
              <Archive className="mr-1.5 h-3.5 w-3.5" /> Arquivados <span className="ml-1.5 opacity-60">{counts.arquivados}</span>
            </TabsTrigger>
          </TabsList>
          </div>
        </Tabs>

        {isError ? <div role="alert" className="space-y-3 text-sm text-destructive"><p>Não deu pra carregar seus eventos. Tente novamente.</p><Button variant="outline" onClick={() => void refetch()}>Tentar novamente</Button></div> : loading ? (
          <LoadingState message="Carregando seus rolês…" />
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center space-y-3 border border-dashed border-foreground/15 rounded-2xl">
            <p className="text-muted-foreground text-sm">Nada por aqui ainda.</p>
            {canSubmit ? (
              <Button
                asChild
                variant="outline"
                className="rounded-full border-foreground/15 hover:bg-foreground/5"
              >
                <Link to={ROUTES.ENVIAR_EVENTO}>Divulgar meu primeiro evento</Link>
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">
                Pra criar ou editar eventos você precisa de acesso de Divulgador — peça acima.
              </p>
            )}
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((r) => (
              <li
                key={r.id}
                className="group flex min-w-0 gap-3 rounded-lg border border-border bg-background p-3 transition-colors hover:border-foreground/25 sm:gap-4 sm:p-4"
              >
                <div className="hidden sm:block shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-foreground/5">
                  {r.image_url ? (
                    <img
                      src={r.image_url}
                      alt={r.event_title || r.atrativo_name || "Evento"}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-foreground/70">
                      <Calendar className="h-6 w-6" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                   <div className="flex min-w-0 flex-col items-start gap-2 xs:flex-row xs:justify-between xs:gap-3">
                     <h3 className="min-w-0 break-words font-semibold tracking-tight text-foreground xs:truncate">
                      {r.event_title || r.atrativo_name || "Evento sem título"}
                    </h3>
                      <div className="flex flex-wrap items-center gap-1.5"><StatusBadge status={tab === "arquivados" ? "Arquivado" : r.status} approvedAt={r.approved_at} /><Badge variant={r.promotion_choice === "highlight" || r.is_highlight ? "default" : "secondary"}>{r.promotion_choice === "highlight" || r.is_highlight ? "Patrocinado" : "Gratuito"}</Badge></div>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    {r.date ? formatBrazilianDate(r.date) : "Data a confirmar"}
                    {r.start_time && ` · ${r.start_time}`}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Métricas do evento">
                    <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{r.views_count ?? 0} visualizações</span>
                    <span className="inline-flex items-center gap-1"><Share2 className="h-3.5 w-3.5" />{r.shares_count ?? 0} compartilhamentos</span>
                    <span className="inline-flex items-center gap-1"><MousePointerClick className="h-3.5 w-3.5" />{clickCounts[r.id] === undefined ? "Sem coleta de cliques" : `${clickCounts[r.id]} cliques no flyer`}</span>
                  </div>
                  {r.status === "rejeitado" && r.rejection_reason && (
                    <p className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-2 py-1.5">
                      <span className="font-semibold">Motivo: </span>
                      {r.rejection_reason}
                    </p>
                  )}
                  {tab === "arquivados" ? <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => setViewing(r as unknown as Row)}><Eye className="mr-1.5 h-3.5 w-3.5" /> Consultar</Button>
                    {isDivulgador && <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.ENVIAR_EVENTO, { state: { repeatEventId: r.id } })}><Repeat2 className="mr-1.5 h-3.5 w-3.5" /> Repetir evento</Button>}
                  </div> : isDivulgador && user && r.user_id === user.id && (
                    <div className="pt-1">
                       {!canEditOwnEvent(r) ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Lock className="h-3 w-3" />
                           Edição pela Curadoria. Peça o ajuste à equipe.
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="min-h-11 text-sm"
                          onClick={() => setEditing(r as unknown as EventoEditavel)}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1.5" />
                          Editar
                        </Button>
                      )}
                    </div>
                  )}
                  {tab !== "arquivados" && ["aprovado", "publicado", "divulgado"].includes(r.status) && <Button variant="outline" size="sm" className="min-h-11" onClick={() => setSharing(r as PromoterShareEvent)}><Share2 className="mr-1.5 h-4 w-4" />Compartilhar rolê</Button>}
                  {tab !== "arquivados" && ["aprovado", "publicado", "divulgado"].includes(r.status) && r.slug && (
                    <Link
                      to={`/evento/${r.slug}`}
                      className="inline-block text-xs font-semibold text-foreground/80 hover:text-foreground underline underline-offset-4"
                    >
                      Ver na agenda →
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ShareOwnEventDialog event={sharing} onClose={() => setSharing(null)} />
      <EditarMeuEventoDialog
        evento={editing}
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        onSaved={() => refetch?.()}
      />
      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{viewing?.event_title || "Evento arquivado"}</DialogTitle><DialogDescription>Histórico privado · somente consulta</DialogDescription></DialogHeader>
          {viewing && <div className="space-y-3 text-sm">
            <p>{viewing.date ? formatBrazilianDate(viewing.date) : "Data a confirmar"} · {viewing.start_time?.slice(0, 5)}{viewing.end_time ? ` às ${viewing.end_time.slice(0, 5)}` : ""}</p>
            <p className="font-medium">{viewing.location || "Local não informado"}</p>
            <p className="max-h-60 overflow-y-auto whitespace-pre-wrap break-words text-muted-foreground">{viewing.description || "Sem descrição cadastrada."}</p>
          </div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}