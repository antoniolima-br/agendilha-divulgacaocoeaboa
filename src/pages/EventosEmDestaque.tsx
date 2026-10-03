import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CalendarDays, Clock, MapPin, Navigation, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { qk } from "@/data/queryKeys";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageContainer } from "@/components/ui/PageContainer";
import { formatEventDateTimeBR, isCurrentOrFutureEventDate, PUBLIC_EVENT_STATUSES, saoPauloTodayISO } from "@/lib/eventDate";
import { eventLocationLabel, eventMapsUrl } from "@/lib/eventLocation";
import { isHighlightActive } from "@/lib/highlights";

type HighlightedEvent = {
  id: string;
  slug: string | null;
  event_title: string | null;
  atrativo_name: string | null;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  address_street: string | null;
  address_number: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  is_highlight: boolean | null;
  highlight_active: boolean | null;
  highlight_hidden: boolean | null;
  highlight_until: string | null;
};

export default function EventosEmDestaque() {
  const { data: events = [], isLoading, isError, refetch } = useQuery({
    queryKey: qk.highlights.publicList(),
    queryFn: async (): Promise<HighlightedEvent[]> => {
      const { data, error } = await supabase
        .from("public_submissions")
        .select("id, slug, event_title, atrativo_name, date, start_time, end_time, location, address_street, address_number, address_neighborhood, address_city, address_state, latitude, longitude, image_url, is_highlight, highlight_active, highlight_hidden, highlight_until")
        .in("status", [...PUBLIC_EVENT_STATUSES])
        .eq("is_highlight", true)
        .gte("date", saoPauloTodayISO())
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });
      if (error) throw error;
      return (Array.isArray(data) ? data : []).filter(
        (event): event is HighlightedEvent => isCurrentOrFutureEventDate(event.date) && isHighlightActive(event),
      );
    },
    staleTime: 30_000,
  });

  return (
    <PageContainer maxWidth="6xl" className="space-y-8">
      <header className="border-b border-border pb-6">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
          <Sparkles className="h-4 w-4" /> Seleção em evidência
        </p>
        <h1 className="mt-2 font-display text-3xl font-black text-foreground sm:text-5xl">Eventos em destaque</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Horário, local e caminho dos rolês que estão no topo da agenda. Sem precisar entrar.
        </p>
      </header>

      {isLoading ? (
        <LoadingState message="Buscando os destaques…" />
      ) : isError ? (
        <EmptyState icon={Sparkles} title="Os destaques não carregaram agora" description="Tente novamente em instantes." actionLabel="Tentar novamente" onAction={() => void refetch()} />
      ) : events.length === 0 ? (
        <EmptyState icon={CalendarDays} title="Nenhum destaque por enquanto" description="Os próximos rolês em evidência aparecem aqui." />
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => {
            const mapsUrl = eventMapsUrl(event);
            const title = event.event_title || event.atrativo_name || "Rolê";
            return (
              <li key={event.id}>
                <article className="h-full overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                  <div className="aspect-[4/5] overflow-hidden bg-muted">
                    {event.image_url ? (
                      <img src={event.image_url} alt={`Flyer de ${title}`} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground"><Sparkles className="h-10 w-10" /></div>
                    )}
                  </div>
                  <div className="space-y-4 p-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-primary">{formatEventDateTimeBR(event.date, event.start_time)}</p>
                      <h2 className="mt-1 break-words text-xl font-black leading-tight text-card-foreground">{title}</h2>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2"><Clock className="h-4 w-4 shrink-0 text-primary" />{event.start_time?.slice(0, 5) || "Horário a confirmar"}{event.end_time ? ` – ${event.end_time.slice(0, 5)}` : ""}</p>
                      <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{eventLocationLabel(event)}</span></p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button asChild variant="outline"><Link to={`/evento/${event.slug || event.id}`}>Ver rolê</Link></Button>
                      {mapsUrl ? <Button asChild><a href={mapsUrl} target="_blank" rel="noopener noreferrer"><Navigation className="mr-2 h-4 w-4" />Rota</a></Button> : <Button disabled>Rota indisponível</Button>}
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </PageContainer>
  );
}