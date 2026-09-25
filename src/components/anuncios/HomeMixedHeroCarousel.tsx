import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, ExternalLink, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { eventDateISO } from "@/lib/eventDate";
import { getEventFallbackImage } from "@/lib/event-utils";
import { cn } from "@/lib/utils";

const AUTOPLAY_MS = 6_000;

interface HeroEvent {
  id: string;
  event_title: string | null;
  date: string | null;
  start_time: string | null;
  location: string | null;
  address_street?: string | null;
  address_neighborhood: string | null;
  category: string | null;
  description?: string | null;
  image_url?: string | null;
  atrativo_style?: string | null;
  is_highlight?: boolean | null;
  highlight_active?: boolean | null;
}

export function HomeMixedHeroCarousel({
  events,
  onOpenEvent,
}: {
  events: HeroEvent[];
  onOpenEvent: (id: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<HeroEvent | null>(null);

  const items = useMemo(() => events.slice(0, 6), [events]);

  const total = items.length;
  const goTo = useCallback((next: number) => {
    setIndex(total ? (next + total) % total : 0);
  }, [total]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (paused || reduceMotion || total < 2) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % total), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [paused, reduceMotion, total]);

  useEffect(() => {
    if (index >= total) setIndex(0);
  }, [index, total]);

  if (total === 0) return null;
  const item = items[index];
  if (!item) return null;

  const openCurrent = () => {
    setSelectedEvent(item);
  };

  const titleOf = (e: HeroEvent) => e.event_title || e.atrativo_style || e.category || "Evento";
  const title = titleOf(item);
  const location = [item.location, item.address_neighborhood].filter(Boolean).join(" · ");
  const dateLabel = item.date
    ? new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit", timeZone: "UTC" })
        .format(new Date(`${eventDateISO(item.date)}T12:00:00Z`))
        .replace(",", "")
        .toUpperCase()
    : null;
  const timeLabel = item.start_time ? item.start_time.slice(0, 5) : null;

  return (
    <section
      className="relative left-1/2 mb-12 w-screen -translate-x-1/2"
      aria-label="Destaques da Ilha"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="relative overflow-hidden bg-card">
        <Button
          type="button"
          variant="ghost"
          onClick={openCurrent}
          className="group relative block h-auto w-full rounded-none p-0 text-left hover:bg-card"
          aria-label={`Abrir evento ${title}`}
        >
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted sm:aspect-[16/7]">
            {items.map((entry, i) => {
              const img = entry.image_url || getEventFallbackImage(entry.category);
              return (
                <div
                  key={entry.id}
                  aria-hidden={i !== index}
                  className={cn(
                    "absolute inset-0 transition-opacity duration-1000 ease-in-out",
                    i === index ? "opacity-100" : "opacity-0",
                  )}
                >
                  <img src={img} alt="" aria-hidden="true" decoding="async" loading={i === 0 ? "eager" : "lazy"} className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-xl" />
                  <img src={img} alt={titleOf(entry)} decoding="async" loading={i === 0 ? "eager" : "lazy"} className="relative h-full w-full object-contain" />
                </div>
              );
            })}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/25 to-transparent" />
          <div key={item.id} className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-screen-lg p-5 pb-8 text-background animate-in fade-in slide-in-from-bottom-2 duration-700 sm:p-8 sm:pb-12">
            <Badge variant="secondary" className="mb-3">
              {item.is_highlight || item.highlight_active ? "Em destaque" : "Evento"}
            </Badge>
            {(dateLabel || timeLabel) && (
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-background/85 sm:text-sm">
                {[dateLabel, timeLabel].filter(Boolean).join(" · ")}
              </p>
            )}
            <h2 className="max-w-3xl font-display text-2xl font-bold sm:text-4xl">{title}</h2>
            {location && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-background/80">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{location}</span>
              </p>
            )}
          </div>
        </Button>

        {total > 1 && (
          <>
            <Button type="button" variant="secondary" size="icon" className="absolute left-3 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full" onClick={() => goTo(index - 1)} aria-label="Destaque anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button type="button" variant="secondary" size="icon" className="absolute right-3 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full" onClick={() => goTo(index + 1)} aria-label="Próximo destaque">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {total > 1 && (
        <div className="mt-3 flex justify-center gap-1" aria-label="Escolher destaque">
          {items.map((entry, dotIndex) => (
            <Button key={entry.id} type="button" variant="ghost" size="icon" className="h-6 w-6 rounded-full p-0" onClick={() => goTo(dotIndex)} aria-label={`Ver destaque ${dotIndex + 1}`} aria-current={dotIndex === index ? "true" : undefined}>
              <span className={cn("h-2 rounded-full bg-muted-foreground/30 transition-all", dotIndex === index ? "w-5 bg-primary" : "w-2")} />
            </Button>
          ))}
        </div>
      )}

      {total > 1 && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Mais eventos">
          {items.filter((_, itemIndex) => itemIndex !== index).slice(0, 5).map((event) => {
            const eventIndex = items.findIndex((candidate) => candidate.id === event.id);
            const thumbnail = event.image_url || getEventFallbackImage(event.category);
            return (
              <Button
                key={event.id}
                type="button"
                variant="ghost"
                onClick={() => goTo(eventIndex)}
                className="group h-auto min-w-0 justify-start gap-3 rounded-lg border bg-card p-2 text-left hover:bg-muted sm:p-3"
                aria-label={`Destacar evento ${event.event_title || "Evento"}`}
              >
                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md bg-muted sm:h-24 sm:w-20">
                  <img src={thumbnail} alt="" aria-hidden="true" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-35 blur-md" />
                  <img src={thumbnail} alt="" loading="lazy" decoding="async" className="relative h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 whitespace-normal text-sm font-semibold leading-snug text-foreground">
                    {event.event_title || event.atrativo_style || event.category || "Evento"}
                  </p>
                  {event.address_neighborhood && (
                    <p className="mt-1 truncate text-xs font-normal text-muted-foreground">{event.address_neighborhood}</p>
                  )}
                </div>
              </Button>
            );
          })}
        </div>
      )}

      <Dialog open={Boolean(selectedEvent)} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        {selectedEvent && (
          <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto p-0">
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted sm:aspect-video">
              <img
                src={selectedEvent.image_url || getEventFallbackImage(selectedEvent.category)}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full scale-110 object-cover opacity-35 blur-xl"
              />
              <img
                src={selectedEvent.image_url || getEventFallbackImage(selectedEvent.category)}
                alt={selectedEvent.event_title || selectedEvent.atrativo_style || "Evento"}
                loading="lazy"
                decoding="async"
                className="relative h-full w-full object-contain"
              />
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <DialogHeader className="pr-7 text-left">
                <div className="mb-1 flex flex-wrap gap-2">
                  <Badge variant="secondary">{selectedEvent.is_highlight || selectedEvent.highlight_active ? "Em destaque" : "Evento"}</Badge>
                  {selectedEvent.category && <Badge variant="outline">{selectedEvent.category}</Badge>}
                </div>
                <DialogTitle className="text-xl sm:text-2xl">
                  {selectedEvent.event_title || selectedEvent.atrativo_style || selectedEvent.category || "Evento"}
                </DialogTitle>
                <DialogDescription>Confira as principais informações deste rolê.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                {selectedEvent.date && (
                  <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 shrink-0 text-secondary" />{new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${eventDateISO(selectedEvent.date)}T12:00:00Z`))}</p>
                )}
                {selectedEvent.start_time && (
                  <p className="flex items-center gap-2"><Clock3 className="h-4 w-4 shrink-0 text-secondary" />{selectedEvent.start_time.slice(0, 5)}</p>
                )}
                {(selectedEvent.location || selectedEvent.address_street || selectedEvent.address_neighborhood) && (
                  <p className="flex items-start gap-2 sm:col-span-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />{[selectedEvent.location, selectedEvent.address_street, selectedEvent.address_neighborhood].filter(Boolean).join(" · ")}</p>
                )}
              </div>

              {selectedEvent.description && <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{selectedEvent.description}</p>}

              <Button type="button" className="w-full font-bold" onClick={() => onOpenEvent(selectedEvent.id)}>
                <ExternalLink className="mr-2 h-4 w-4" /> Ver evento completo
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>

    </section>
  );
}