import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { useMyEventHistory } from "@/data/useMyEventHistory";
import { isArchivedEvent } from "@/lib/eventArchive";
import { ROUTES } from "@/routes/config";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { EditarMeuEventoDialog, type EventoEditavel } from "@/components/divulgador/EditarMeuEventoDialog";
import { Pencil, Lock, Archive, Eye, Repeat2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { SolicitarDivulgadorCard } from "@/components/divulgador/SolicitarDivulgadorCard";
import { useDivulgadorStatus } from "@/data/useDivulgadorStatus";
import { LoadingState } from "@/components/ui/LoadingState";

type StatusKey = "todos" | "pendente" | "aprovado" | "rejeitado" | "arquivados";

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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; Icon: any }> = {
    pendente: {
      label: "Em análise",
      cls: "border-amber-600/30 text-amber-700 bg-amber-50/60",
      Icon: Clock,
    },
    aprovado: {
      label: "Aprovado",
      cls: "border-emerald-600/30 text-emerald-700 bg-emerald-50/60",
      Icon: ShieldCheck,
    },
    publicado: {
      label: "Publicado",
      cls: "border-emerald-600/30 text-emerald-700 bg-emerald-50/60",
      Icon: ShieldCheck,
    },
    rejeitado: {
      label: "Rejeitado",
      cls: "border-red-600/30 text-red-700 bg-red-50/60",
      Icon: XCircle,
    },
  };
  const m = map[status] || {
    label: status,
    cls: "border-foreground/15 text-foreground/70 bg-foreground/5",
    Icon: AlertCircle,
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-[0.14em] ${m.cls}`}
    >
      <m.Icon className="h-3 w-3" strokeWidth={2} />
      {m.label}
    </span>
  );
}

export default function MeusEventos() {
  const { user } = useAuth();
  const [tab, setTab] = useState<StatusKey>("todos");
  const { isDivulgador } = useDivulgadorStatus();
  const { canApprove } = useAppPermissions();
  const [editing, setEditing] = useState<EventoEditavel | null>(null);
  const [viewing, setViewing] = useState<Row | null>(null);
  const navigate = useNavigate();

  const { data: history = [], isLoading: loading, isError, refetch } = useMyEventHistory(user?.id);
  const rows = useMemo(() => history.filter((row) => !!user && row.user_id === user.id), [history, user]);

  const counts = useMemo(() => {
    const c = { todos: 0, pendente: 0, aprovado: 0, rejeitado: 0, arquivados: 0 } as Record<StatusKey, number>;
    rows.forEach((r) => {
      if (isArchivedEvent(r.date)) { c.arquivados++; return; }
      c.todos++;
      if (r.status === "pendente") c.pendente++;
      else if (["aprovado", "publicado", "divulgado"].includes(r.status)) c.aprovado++;
      else if (r.status === "rejeitado") c.rejeitado++;
    });
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    if (tab === "arquivados") return rows.filter((r) => isArchivedEvent(r.date));
    const active = rows.filter((r) => !isArchivedEvent(r.date));
    if (tab === "todos") return active;
    if (tab === "aprovado")
      return active.filter((r) => ["aprovado", "publicado", "divulgado"].includes(r.status));
    return active.filter((r) => r.status === tab);
  }, [rows, tab]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14 space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-foreground/12 bg-foreground/[0.02] mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/60">
                Painel pessoal · Divulgador
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">
              Área do Divulgador
            </h1>
            <p className="text-foreground/65 mt-1 text-sm">
              Meus eventos — somente os rolês que você cadastrou.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
          {canApprove && <Button asChild variant="outline"><Link to={ROUTES.ADMIN_APROVAR_EVENTOS}><ShieldCheck className="mr-2 h-4 w-4" />Curadoria geral</Link></Button>}
          {isDivulgador && (
            <Button
              asChild
              className="w-full rounded-full bg-foreground px-5 font-semibold tracking-tight text-background shadow-none hover:bg-foreground/90 sm:w-auto"
            >
              <Link to={ROUTES.ENVIAR_EVENTO}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Divulgar evento
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
              Em análise <span className="ml-1.5 opacity-60">{counts.pendente}</span>
            </TabsTrigger>
            <TabsTrigger value="aprovado" className="shrink-0 rounded-full px-4">
              Aprovados <span className="ml-1.5 opacity-60">{counts.aprovado}</span>
            </TabsTrigger>
            <TabsTrigger value="rejeitado" className="shrink-0 rounded-full px-4">
              Rejeitados <span className="ml-1.5 opacity-60">{counts.rejeitado}</span>
            </TabsTrigger>
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
            <p className="text-foreground/65 text-sm">Nada por aqui ainda.</p>
            {isDivulgador ? (
              <Button
                asChild
                variant="outline"
                className="rounded-full border-foreground/15 hover:bg-foreground/5"
              >
                <Link to={ROUTES.ENVIAR_EVENTO}>Divulgar meu primeiro evento</Link>
              </Button>
            ) : (
              <p className="text-xs text-foreground/55">
                Pra criar ou editar eventos você precisa de acesso de Divulgador — peça acima.
              </p>
            )}
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((r) => (
              <li
                key={r.id}
                className="group flex min-w-0 gap-3 rounded-2xl border border-foreground/10 bg-background p-3 transition-colors hover:border-foreground/25 sm:gap-4 sm:p-4"
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
                      <StatusBadge status={tab === "arquivados" ? "Arquivado" : r.status} />
                  </div>
                  <p className="text-xs text-foreground/60 flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    {r.date ? formatBrazilianDate(r.date) : "Data a confirmar"}
                    {r.start_time && ` · ${r.start_time}`}
                  </p>
                  {r.status === "rejeitado" && r.rejection_reason && (
                    <p className="text-xs text-red-700 bg-red-50/60 border border-red-200/60 rounded-md px-2 py-1.5">
                      <span className="font-semibold">Motivo: </span>
                      {r.rejection_reason}
                    </p>
                  )}
                  {tab === "arquivados" ? <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => setViewing(r as unknown as Row)}><Eye className="mr-1.5 h-3.5 w-3.5" /> Consultar</Button>
                    {isDivulgador && <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.ENVIAR_EVENTO, { state: { repeatEventId: r.id } })}><Repeat2 className="mr-1.5 h-3.5 w-3.5" /> Repetir evento</Button>}
                  </div> : isDivulgador && user && r.user_id === user.id && (
                    <div className="pt-1">
                       {["aprovado", "publicado", "divulgado"].includes(r.status) ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-foreground/55">
                          <Lock className="h-3 w-3" />
                           Já aprovado — peça alteração pra curadoria.
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full h-8 text-xs border-foreground/15 hover:bg-foreground/5"
                          onClick={() => setEditing(r as unknown as EventoEditavel)}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1.5" />
                          Editar
                        </Button>
                      )}
                    </div>
                  )}
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