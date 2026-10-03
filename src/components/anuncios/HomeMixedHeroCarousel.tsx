import { useCallback, useEffect, useMemo, useState } from "react";
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
  events: HeroEvent[];
  onOpenEvent: (id: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<HeroEvent | null>(null);
  const [ratios, setRatios] = useState<Record<string, number>>({});
  const [trims, setTrims] = useState<Record<string, { t: number; b: number }>>({});

  const items = useMemo(() => events, [events]);
  useEffect(() => {
    let cancelled = false;
    let idleId: number | undefined;
    const visibleSlides = [items[index], items[(index + 1) % Math.max(1, items.length)]].filter(Boolean);
    const analyzeSlides = () => visibleSlides.forEach((slide) => {
      const src = slide.image_url;
      if (!src || trims[slide.id]) return;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const w = 80;
          const h = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * w));
          const c = document.createElement("canvas");
          c.width = w; c.height = h;
          const ctx = c.getContext("2d");
          if (!ctx) return;
          ctx.drawImage(img, 0, 0, w, h);
          const d = ctx.getImageData(0, 0, w, h).data;
          const flat = (y: number) => {
            let sum = 0, sq = 0;
            for (let x = 0; x < w; x++) {
              const i = (y * w + x) * 4;
              const v = (d[i] + d[i + 1] + d[i + 2]) / 3;
              sum += v; sq += v * v;
            }
            const m = sum / w;
            return { m, flat: Math.sqrt(Math.max(0, sq / w - m * m)) < 10 };
          };
          const same = (y: number, ref: number) => { const r = flat(y); return r.flat && Math.abs(r.m - ref) < 10; };
          const max = Math.floor(h * 0.35);
          void same;
          // Corta todas as linhas lisas (qualquer cor) no topo/base, tolerando 1 linha de transição.
          const scan = (row: (i: number) => number) => {
            let n = 0, miss = 0;
            while (n < max) {
              if (flat(row(n)).flat) { n++; miss = 0; }
              else if (miss < 1 && n > 0) { n++; miss++; }
              else break;
            }
            return Math.max(0, n - miss - 1);
          };
          const top = Math.min(max, scan((i) => i));
          const bot = Math.min(max, scan((i) => h - 1 - i));
          if (!cancelled) setTrims((prev) => ({ ...prev, [slide.id]: { t: top / h, b: bot / h } }));
        } catch { /* CORS: sem recorte */ }
      };
      img.src = src;
    });
    idleId = window.requestIdleCallback?.(analyzeSlides, { timeout: 800 });
    const timerId = idleId === undefined ? window.setTimeout(analyzeSlides, 0) : undefined;
    return () => {
      cancelled = true;
      if (idleId !== undefined) window.cancelIdleCallback?.(idleId);
      if (timerId !== undefined) window.clearTimeout(timerId);
    };
  }, [index, items, trims]);


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
    >
      <div className="relative w-full overflow-hidden bg-background">
        <div aria-hidden="true" className="w-full" style={{ aspectRatio: String((ratios[items[index]?.id] ?? 4 / 5) / Math.max(0.3, 1 - (trims[items[index]?.id]?.t ?? 0) - (trims[items[index]?.id]?.b ?? 0))) }} />
        <div aria-hidden="true" className="h-[9.5rem]" />
        {items.map((slide, slideIndex) => {
          const active = slideIndex === index;
          const slideTitle = slide.event_title || slide.atrativo_style || slide.category || "Evento";
          const slideImage = slide.image_url || getEventFallbackImage(slide.category);
          const slideLocation = [slide.location, slide.address_neighborhood].filter(Boolean).join(" · ");
          const slideDate = formatEventDateTimeBR(slide.date, slide.start_time);
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
              <div className="absolute inset-x-0 top-0 h-[calc(100%-9.5rem)] overflow-hidden"><img src={slideImage} alt={slideTitle} decoding="async" loading={slideIndex === 0 ? "eager" : "lazy"} fetchPriority={slideIndex === 0 ? "high" : "low"} onLoad={(e) => { const el = e.currentTarget; if (el.naturalWidth && el.naturalHeight) { const r = el.naturalWidth / el.naturalHeight; setRatios((prev) => (prev[slide.id] === r ? prev : { ...prev, [slide.id]: r })); } }} className="absolute inset-x-0 w-full object-fill" style={(() => { const t = trims[slide.id]?.t ?? 0; const b = trims[slide.id]?.b ?? 0; const k = Math.max(0.3, 1 - t - b); return { top: `${(-t / k) * 100}%`, height: `${100 / k}%` }; })()} /></div>
              <div className="absolute inset-0 bg-gradient-to-t from-background from-[9.5rem] to-transparent to-[9.5rem]" />
              <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-6xl px-4 flex h-[9.5rem] flex-col justify-end pb-5 text-center text-foreground sm:px-8 sm:pb-9">
                <h2 className="line-clamp-2 mx-auto max-w-3xl font-display uppercase text-2xl font-bold leading-tight sm:text-4xl">{slideTitle}</h2>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 justify-center text-sm text-foreground/85">
                  {slideDate && (
                    <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />{slideDate}</span>
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
            <Button type="button" variant="secondary" size="icon" className="absolute left-3 top-[35%] z-20 h-11 w-11 -translate-y-1/2 rounded-full border-0 bg-background/20 text-foreground opacity-50 shadow-none backdrop-blur-sm hover:bg-background/40 hover:opacity-90" onClick={() => goTo(index - 1)} aria-label="Destaque anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button type="button" variant="secondary" size="icon" className="absolute right-3 top-[35%] z-20 h-11 w-11 -translate-y-1/2 rounded-full border-0 bg-background/20 text-foreground opacity-50 shadow-none backdrop-blur-sm hover:bg-background/40 hover:opacity-90" onClick={() => goTo(index + 1)} aria-label="Próximo destaque">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="absolute inset-x-0 bottom-0.5 z-20 flex justify-center gap-1" aria-label="Escolher destaque">
              {items.map((entry, dotIndex) => (
                <button key={entry.id} type="button" className="flex h-6 w-6 items-center justify-center" onClick={() => goTo(dotIndex)} aria-label={`Ver destaque ${dotIndex + 1}`} aria-current={dotIndex === index ? "true" : undefined}>
                  <span className={cn("h-1.5 rounded-full bg-background/50 transition-all", dotIndex === index ? "w-5 bg-background" : "w-1.5")} />
                </button>
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