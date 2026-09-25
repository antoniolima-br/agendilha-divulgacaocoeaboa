import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, ExternalLink, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { eventDateISO } from "@/lib/eventDate";
import { getEventFallbackImage } from "@/lib/event-utils";
import { cn } from "@/lib/utils";

const AUTOPLAY_MS = 4_000;

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

  const formatDate = (date: string | null) =>
    date
      ? new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short", timeZone: "UTC" }).format(new Date(`${eventDateISO(date)}T12:00:00Z`))
      : null;

  return (
    <section
      className="mb-2"
      aria-label="Destaques da Ilha"
      aria-roledescription="carrossel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="relative w-full overflow-hidden bg-muted aspect-[4/5] xs:aspect-[1/1] sm:aspect-[16/8] lg:aspect-[16/6]">
        {items.map((slide, slideIndex) => {
          const active = slideIndex === index;
          const slideTitle = slide.event_title || slide.atrativo_style || slide.category || "Evento";
          const slideImage = slide.image_url || getEventFallbackImage(slide.category);
          const slideLocation = [slide.location, slide.address_neighborhood].filter(Boolean).join(" · ");
          const slideDate = formatDate(slide.date);
          return (
            <button
              key={slide.id}
              type="button"
              onClick={() => setSelectedEvent(slide)}
              tabIndex={active ? 0 : -1}
              aria-hidden={!active}
              aria-label={`Abrir evento ${slideTitle}`}
              className={cn(
                "absolute inset-0 block h-full w-full text-left transition-opacity ease-in-out motion-reduce:transition-none",
                "duration-1000",
                active ? "z-10 opacity-100" : "z-0 opacity-0 pointer-events-none",
              )}
            >
              <img src={slideImage} alt="" aria-hidden="true" decoding="async" loading={slideIndex === 0 ? "eager" : "lazy"} className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-2xl" />
              <img src={slideImage} alt={slideTitle} decoding="async" loading={slideIndex === 0 ? "eager" : "lazy"} className="relative h-full w-full object-contain" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 via-30% to-transparent" />
              {slide.date && (
                <div className="absolute left-4 top-4 flex h-16 w-16 flex-col items-center justify-center rounded-full border-2 border-primary bg-background/70 text-foreground backdrop-blur-sm sm:left-8 sm:top-6 sm:h-20 sm:w-20">
                  <span className="font-display text-2xl font-bold leading-none sm:text-3xl">{eventDateISO(slide.date).slice(8, 10)}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">{new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" }).format(new Date(`${eventDateISO(slide.date)}T12:00:00Z`)).replace(".", "")}</span>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-6xl px-4 pb-8 text-center text-foreground sm:px-8 sm:pb-10">
                <h2 className="line-clamp-2 mx-auto max-w-3xl font-display uppercase text-2xl font-bold leading-tight sm:text-4xl">{slideTitle}</h2>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 justify-center text-sm text-foreground/85">
                  {slideDate && (
                    <span className="flex items-center gap-1.5 capitalize"><CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />{slideDate}</span>
                  )}
                  {slide.start_time && (
                    <span className="flex items-center gap-1.5"><Clock3 className="h-4 w-4 shrink-0" aria-hidden="true" />{slide.start_time.slice(0, 5)}</span>
                  )}
                  {slideLocation && (
                    <span className="flex min-w-0 items-center gap-1.5"><MapPin className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="truncate">{slideLocation}</span></span>
                  )}
                </div>
              </div>
            </button>
          );
        })}

        {total > 1 && (
          <>
            <Button type="button" variant="secondary" size="icon" className="absolute left-3 top-1/2 z-20 h-11 w-11 -translate-y-1/2 rounded-full border-0 bg-background/20 text-foreground opacity-50 shadow-none backdrop-blur-sm hover:bg-background/40 hover:opacity-90" onClick={() => goTo(index - 1)} aria-label="Destaque anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button type="button" variant="secondary" size="icon" className="absolute right-3 top-1/2 z-20 h-11 w-11 -translate-y-1/2 rounded-full border-0 bg-background/20 text-foreground opacity-50 shadow-none backdrop-blur-sm hover:bg-background/40 hover:opacity-90" onClick={() => goTo(index + 1)} aria-label="Próximo destaque">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="absolute inset-x-0 bottom-2 z-20 flex justify-center gap-1" aria-label="Escolher destaque">
              {items.map((entry, dotIndex) => (
                <button key={entry.id} type="button" className="flex h-6 w-6 items-center justify-center" onClick={() => goTo(dotIndex)} aria-label={`Ver destaque ${dotIndex + 1}`} aria-current={dotIndex === index ? "true" : undefined}>
                  <span className={cn("h-1.5 rounded-full bg-background/50 transition-all", dotIndex === index ? "w-5 bg-background" : "w-1.5")} />
                </button>
              ))}
            </div>
          </>
        )}
      </div>


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