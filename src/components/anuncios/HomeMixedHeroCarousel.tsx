import { useCallback, useEffect, useMemo, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, ExternalLink, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { eventDateISO, formatEventDateTimeBR } from "@/lib/eventDate";
import { getEventFallbackImage } from "@/lib/event-utils";
import { cn } from "@/lib/utils";

const AUTOPLAY_MS = 5_000;

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
  events?: HeroEvent[] | null;
  onOpenEvent: (id: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<HeroEvent | null>(null);
  const items = useMemo(() => {
    const seen = new Set<string>();
    return (Array.isArray(events) ? events : []).filter((event) => {
      if (!event?.id || seen.has(event.id)) return false;
      seen.add(event.id);
      return true;
    });
  }, [events]);
  const total = items.length;
  const [viewportRef, carousel] = useEmblaCarousel({ loop: total > 1, duration: reduceMotion ? 0 : 25 });
  const goTo = useCallback((next: number) => {
    if (total) carousel?.scrollTo(((next % total) + total) % total);
  }, [carousel, total]);

  useEffect(() => {
    if (!carousel) return;
    const sync = () => setIndex(carousel.selectedScrollSnap());
    const startDrag = () => setDragging(true);
    const endDrag = () => setDragging(false);
    sync();
    carousel.on("select", sync).on("reInit", sync).on("pointerDown", startDrag).on("pointerUp", endDrag);
    return () => {
      carousel.off("select", sync).off("reInit", sync).off("pointerDown", startDrag).off("pointerUp", endDrag);
    };
  }, [carousel]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!carousel || hovered || focused || dragging || selectedEvent || reduceMotion || total < 2) return;
    const timer = window.setTimeout(() => {
      if (document.hidden) return;
      goTo(index + 1);
    }, AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [carousel, hovered, focused, dragging, selectedEvent, reduceMotion, total, index, goTo]);

  if (total === 0) return null;
  const item = items[index] ?? items[0];
  if (!item) return null;

  return (
    <section
      className="mb-2 min-w-0 w-full max-w-full"
      aria-label="Eventos em destaque"
      aria-roledescription="carrossel"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
      onKeyDown={(event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        goTo(index + (event.key === "ArrowRight" ? 1 : -1));
      }}
    >
      <div className="relative w-full overflow-hidden bg-background">
        <div ref={viewportRef} className="overflow-hidden touch-pan-y pinch-zoom">
        <div className="flex items-stretch">
        {items.map((slide, slideIndex) => {
          const active = slideIndex === index;
          const slideTitle = slide.event_title || slide.atrativo_style || slide.category || "Evento";
          const slideImage = slide.image_url || getEventFallbackImage(slide.category);
          const slideLocation = [slide.location, slide.address_neighborhood].filter(Boolean).join(" · ");
          const slideDate = formatEventDateTimeBR(slide.date, slide.start_time);
          return (
            <Button
              key={slide.id}
              type="button"
              variant="ghost"
              onClick={(event) => { if (!event.defaultPrevented) setSelectedEvent(slide); }}
              tabIndex={active ? 0 : -1}
              aria-hidden={!active}
              aria-label={`Abrir evento ${slideTitle}`}
              className="block h-auto min-w-0 flex-[0_0_100%] select-none whitespace-normal rounded-none p-0 text-left hover:bg-background md:h-auto"
            >
              <div className="h-[min(60vh,42rem)] w-full overflow-hidden"><img src={slideImage} alt={slideTitle} draggable={false} decoding="async" loading={slideIndex === 0 || active ? "eager" : "lazy"} fetchPriority={slideIndex === 0 ? "high" : "low"} onError={(event) => { const fallback = getEventFallbackImage(slide.category); if (event.currentTarget.getAttribute("src") !== fallback) event.currentTarget.src = fallback; }} className="h-full w-full object-contain" /></div>
              <div className="mx-auto flex min-h-[9.5rem] w-full max-w-6xl flex-col justify-center px-4 py-5 text-center text-foreground sm:px-8">
                <h2 className="line-clamp-2 mx-auto max-w-3xl break-words font-display uppercase text-2xl font-bold leading-tight sm:text-4xl">{slideTitle}</h2>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 justify-center text-sm text-foreground/85">
                  {slideDate && (
                    <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />{slideDate}</span>
                  )}
                  {slideLocation && (
                    <span className="flex min-w-0 max-w-full items-center gap-1.5"><MapPin className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="truncate">{slideLocation}</span></span>
                  )}
                </div>
              </div>
            </Button>
          );
        })}
        </div>
        </div>

        {total > 1 && (
          <>
            <Button type="button" variant="secondary" size="icon" className="absolute left-3 top-[35%] z-20 h-11 w-11 -translate-y-1/2 rounded-full border-0 bg-background/20 text-foreground opacity-50 shadow-none backdrop-blur-sm hover:bg-background/40 hover:opacity-90" onClick={() => goTo(index - 1)} aria-label="Destaque anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button type="button" variant="secondary" size="icon" className="absolute right-3 top-[35%] z-20 h-11 w-11 -translate-y-1/2 rounded-full border-0 bg-background/20 text-foreground opacity-50 shadow-none backdrop-blur-sm hover:bg-background/40 hover:opacity-90" onClick={() => goTo(index + 1)} aria-label="Próximo destaque">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="flex max-w-full items-center gap-1 overflow-x-auto px-3 py-1" aria-label="Escolher destaque">
              {items.map((entry, dotIndex) => (
                <Button key={entry.id} type="button" variant="ghost" size="icon" className={cn("h-11 w-11 shrink-0 p-0", dotIndex === 0 && "ml-auto", dotIndex === total - 1 && "mr-auto")} onClick={() => goTo(dotIndex)} aria-label={`Ver destaque ${dotIndex + 1}`} aria-current={dotIndex === index ? "true" : undefined}>
                  <span className={cn("h-1.5 rounded-full bg-muted-foreground/50 transition-all motion-reduce:transition-none", dotIndex === index ? "w-5 bg-primary" : "w-1.5")} />
                </Button>
              ))}
            </div>
          </>
        )}
      </div>
      {(item.location || item.atrativo_style) && (
        <p className="mx-auto mt-2 max-w-6xl truncate px-4 text-center font-display text-sm font-semibold uppercase tracking-wide text-primary sm:text-base">
          {item.location || item.atrativo_style}
        </p>
      )}


      <Dialog open={Boolean(selectedEvent)} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        {selectedEvent && (
          <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto p-0">
            <div className="relative w-full overflow-hidden bg-muted">
              <img
                src={selectedEvent.image_url || getEventFallbackImage(selectedEvent.category)}
                alt={selectedEvent.event_title || selectedEvent.atrativo_style || "Evento"}
                loading="lazy"
                decoding="async"
                className="block h-auto w-full"
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