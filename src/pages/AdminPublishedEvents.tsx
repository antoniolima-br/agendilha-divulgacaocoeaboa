import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Clock, Edit, MapPin, RefreshCw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { PUBLIC_EVENT_STATUSES, formatEventDateTimeBR } from "@/lib/eventDate";
import { handleError } from "@/lib/error-handler";
import { qk } from "@/data/queryKeys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageContainer } from "@/components/ui/PageContainer";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { QuickEditEventDialog } from "@/components/events-admin/QuickEditEventDialog";

type PublishedEvent = Tables<"submissions">;

export default function AdminPublishedEvents() {
  const { user, loading: authLoading } = useAuth();
  const { hasPermission, isAdmin, loading: permissionsLoading } = useAppPermissions();
  const canRead = hasPermission("events.read");
  const canEdit = hasPermission("events.update");
  const canDelete = hasPermission("events.delete");
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<PublishedEvent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PublishedEvent | null>(null);
  const [deleting, setDeleting] = useState(false);

  const eventsQuery = useQuery({
    queryKey: [...qk.submissions.all, "published-admin"],
    enabled: canRead,
    queryFn: async (): Promise<PublishedEvent[]> => {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .in("status", [...PUBLIC_EVENT_STATUSES])
        .is("deleted_at", null)
        .or("moderation_status.is.null,moderation_status.neq.blocked")
        .order("date", { ascending: false })
        .order("start_time", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    if (!term) return eventsQuery.data ?? [];
    return (eventsQuery.data ?? []).filter((event) =>
      [event.event_title, event.atrativo_name, event.location, event.address_neighborhood]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase("pt-BR").includes(term)),
    );
  }, [eventsQuery.data, search]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: qk.submissions.all });

  async function deleteEvent() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("submissions").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) {
      handleError(error, "Não deu pra excluir o evento agora.");
      return;
    }
    toast.success("Evento excluído.");
    setDeleteTarget(null);
    await refresh();
  }

  if (authLoading || permissionsLoading) return <LoadingState fullPage message="Verificando permissões..." />;
  if (!user || !isAdmin || !canRead) return <Navigate to="/" replace />;

  return (
    <PageContainer maxWidth="7xl">
      <SectionHeader
        title="Eventos publicados"
        subtitle="Veja os horários e mantenha atualizados os eventos que já estão no app."
        rightElement={
          <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={eventsQuery.isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${eventsQuery.isFetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        }
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por evento, atrativo, local ou bairro"
          className="h-11 pl-9"
        />
      </div>

      {eventsQuery.isLoading ? (
        <LoadingState message="Carregando eventos publicados..." />
      ) : eventsQuery.isError ? (
        <EmptyState
          icon={CalendarDays}
          title="Não deu pra carregar os eventos"
          description="Tente novamente em instantes."
          actionLabel="Tentar novamente"
          onAction={() => void eventsQuery.refetch()}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Nenhum evento publicado"
          description={search ? "Tente buscar por outro nome ou local." : "Os eventos aparecem aqui depois da publicação."}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(10rem,1fr)_minmax(0,1fr)_auto] gap-4 border-b border-border bg-muted/40 px-5 py-3 text-xs font-bold uppercase text-muted-foreground md:grid">
            <span>Evento</span><span>Data e horário</span><span>Local</span><span>Ações</span>
          </div>
          <div className="divide-y divide-border">
            {filtered.map((event) => (
              <article key={event.id} className="grid gap-4 p-4 md:grid-cols-[minmax(0,1.5fr)_minmax(10rem,1fr)_minmax(0,1fr)_auto] md:items-center md:px-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="break-words font-bold text-foreground">{event.event_title || event.atrativo_name || "Rolê"}</h2>
                    {event.is_highlight && <Badge variant="secondary">Destaque</Badge>}
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{event.atrativo_name || event.category || "Sem atrativo informado"}</p>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="flex items-center gap-2 font-semibold"><CalendarDays className="h-4 w-4 text-primary" />{formatEventDateTimeBR(event.date)}</p>
                  <p className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4 text-primary" />{event.start_time?.slice(0, 5) || "A confirmar"} – {event.end_time?.slice(0, 5) || "Sem término"}</p>
                </div>
                <p className="flex min-w-0 items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="break-words">{event.location || "Local a confirmar"}{event.address_neighborhood ? ` · ${event.address_neighborhood}` : ""}</span>
                </p>
                <div className="flex gap-2 md:justify-end">
                  <Button size="sm" variant="outline" onClick={() => setEditing(event)} disabled={!canEdit}>
                    <Edit className="mr-2 h-4 w-4" />Editar
                  </Button>
                  <Button size="icon" variant="destructive" onClick={() => setDeleteTarget(event)} disabled={!canDelete} aria-label={`Excluir ${event.event_title || "evento"}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      <QuickEditEventDialog
        event={editing}
        onClose={() => setEditing(null)}
        onSaved={() => void refresh()}
      />
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={() => void deleteEvent()}
        title="Excluir evento publicado?"
        description={`“${deleteTarget?.event_title || deleteTarget?.atrativo_name || "Este evento"}” será removido do app. Essa ação não pode ser desfeita.`}
        confirmText="Excluir"
        variant="destructive"
        loading={deleting}
      />
    </PageContainer>
  );
}