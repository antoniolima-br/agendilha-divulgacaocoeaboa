import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Clock, MapPin, MessageCircle, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { formatEventDateTimeBR, PUBLIC_EVENT_STATUSES, saoPauloTodayISO } from "@/lib/eventDate";
import { buildWhatsappUrl } from "@/lib/whatsapp";

type PublicEvent = {
  id: string;
  slug: string | null;
  event_title: string | null;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  address_neighborhood: string | null;
  duvidas_phone: string | null;
};

function eventContactUrl(event: PublicEvent) {
  if (!event.duvidas_phone) return null;
  return buildWhatsappUrl(
    event.duvidas_phone,
    `Oi! Vi o rolê ${event.event_title || "publicado"} no Coé a Boa? e queria mais informações.`,
  );
}

export default function EventosPublicos() {
  const [search, setSearch] = useState("");
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["public-events-contact-list"],
    queryFn: async (): Promise<PublicEvent[]> => {
      const { data, error } = await supabase
        .from("public_submissions")
        .select("id, slug, event_title, date, start_time, end_time, location, address_neighborhood, duvidas_phone")
        .in("status", [...PUBLIC_EVENT_STATUSES])
        .gte("date", saoPauloTodayISO())
        .order("date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(500);
      if (error) throw error;
      return (data ?? []).filter((event): event is PublicEvent => Boolean(event.id));
    },
    staleTime: 60_000,
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
                    <Button asChild variant="outline" className="min-h-11 flex-1 sm:flex-none">
                      <Link to={detailsPath}>Ver evento</Link>
                    </Button>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}