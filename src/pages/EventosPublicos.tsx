import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Clock, Edit, MapPin, MessageCircle, Search } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { qk } from "@/data/queryKeys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { formatEventDateTimeBR } from "@/lib/eventDate";
import { buildWhatsappUrl } from "@/lib/whatsapp";
import { QuickEditEventDialog } from "@/components/events-admin/QuickEditEventDialog";
import { fetchPublicEventsList, type PublicEvent } from "@/data/publicEventsList";

function eventContactUrl(event: PublicEvent) {
  if (!event.duvidas_phone) return null;
  return buildWhatsappUrl(
    event.duvidas_phone,
    `Oi! Vi o rolê ${event.event_title || "publicado"} no Coé a Boa? e queria mais informações.`,
  );
}

export default function EventosPublicos() {
  const { user } = useAuth();
  const { hasPermission } = useAppPermissions();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<PublicEvent | null>(null);
  const canEditEvents = Boolean(user && hasPermission("events.update"));
  const { data: events = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: qk.agenda.publicEvents(),
    queryFn: fetchPublicEventsList,
    staleTime: 60_000,
    retry: 1,
    throwOnError: false,
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    if (!term) return events;
    return events.filter((event) =>
      [event.event_title, event.location, event.address_neighborhood]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase("pt-BR").includes(term)),
    );
  }, [events, search]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 py-2 sm:space-y-8 sm:py-6">
      <header className="space-y-2 border-b border-border pb-5">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Agenda pública</p>
        <h1 className="font-display text-3xl font-black text-foreground sm:text-4xl">Eventos publicados</h1>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          Veja quando e onde acontece cada rolê e fale direto com o contato autorizado.
        </p>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por evento, local ou bairro"
          className="h-11 pl-9"
          aria-label="Buscar eventos publicados"
        />
      </div>

      {isLoading ? (
        <LoadingState message="Buscando os eventos publicados…" />
      ) : isError ? (
        <EmptyState
          icon={CalendarDays}
          title="A agenda não carregou agora"
          description="Tente novamente em instantes. Seus eventos continuam seguros."
          actionLabel="Tentar novamente"
          onAction={() => { if (!isFetching) void refetch(); }}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Nenhum evento encontrado"
          description={search ? "Tente buscar por outro nome, local ou bairro." : "A programação nova aparece aqui assim que for publicada."}
        />
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {filtered.map((event) => {
            const contactUrl = eventContactUrl(event);
            const detailsPath = `/evento/${event.slug || event.id}`;
            return (
              <li key={event.id} className="py-5 sm:py-6">
                <article className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="min-w-0 space-y-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-primary">
                        {formatEventDateTimeBR(event.date, event.start_time)}
                        {event.end_time ? ` até ${event.end_time.slice(0, 5)}` : ""}
                      </p>
                      <h2 className="mt-1 break-words text-xl font-black leading-tight text-foreground sm:text-2xl">
                        {event.event_title || "Rolê"}
                      </h2>
                    </div>
                    <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                      <p className="flex min-w-0 items-center gap-2">
                        <Clock className="h-4 w-4 shrink-0 text-primary" />
                        <span>{event.start_time?.slice(0, 5) || "Horário a confirmar"}{event.end_time ? ` – ${event.end_time.slice(0, 5)}` : ""}</span>
                      </p>
                      <p className="flex min-w-0 items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0 text-primary" />
                        <span className="truncate">{event.location || "Local a confirmar"}{event.address_neighborhood ? ` · ${event.address_neighborhood}` : ""}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    {contactUrl ? (
                      <Button asChild className="min-h-11 flex-1 sm:flex-none">
                        <a href={contactUrl} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp do responsável
                        </a>
                      </Button>
                    ) : (
                      <span className="flex min-h-11 items-center text-xs text-muted-foreground">Contato não informado</span>
                    )}
                    {canEditEvents ? (
                      <Button variant="outline" className="min-h-11 flex-1 sm:flex-none" onClick={() => setEditing(event)}>
                        <Edit className="mr-2 h-4 w-4" /> Ver evento
                      </Button>
                    ) : (
                      <Button asChild variant="outline" className="min-h-11 flex-1 sm:flex-none">
                        <Link to={detailsPath}>Ver evento</Link>
                      </Button>
                    )}
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
      <QuickEditEventDialog
        event={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          void queryClient.invalidateQueries({ queryKey: qk.agenda.publicEvents() });
        }}
      />
    </div>
  );
}