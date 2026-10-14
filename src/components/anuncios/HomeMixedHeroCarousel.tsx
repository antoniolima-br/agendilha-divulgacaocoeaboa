import { useCallback, useEffect, useMemo, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Eye, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { eventDateISO } from "@/lib/eventDate";
import { getEventFallbackImage } from "@/lib/event-utils";

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
  onActiveDateChange,
}: {
  events?: HeroEvent[] | null;
  onOpenEvent: (id: string) => void;
  onActiveDateChange?: (date: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
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
    if (!carousel || hovered || focused || dragging || reduceMotion || total < 2) return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      goTo(carousel.selectedScrollSnap() + 1);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [carousel, hovered, focused, dragging, reduceMotion, total, index, goTo]);

  if (total === 0) return null;
  const item = items[index] ?? items[0];
  if (!item) return null;

  useEffect(() => {
    const activeDate = eventDateISO(item.date);
    if (activeDate) onActiveDateChange?.(activeDate);
  }, [item.date, onActiveDateChange]);

  return (
    <section
      className="mb-2 min-w-0 w-full max-w-full"
      aria-label="Eventos em destaque"
      aria-roledescription="carrossel"
      onPointerEnter={(event) => { if (event.pointerType === "mouse") setHovered(true); }}
      onPointerLeave={(event) => { if (event.pointerType === "mouse") setHovered(false); }}
      onTouchStart={() => { setDragging(true); setFocused(false); }}
      onTouchEnd={() => setDragging(false)}
      onTouchCancel={() => setDragging(false)}
      onFocusCapture={(event) => setFocused(event.target.matches(":focus-visible"))}
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
          const distance = Math.abs(slideIndex - index);
          const near = distance <= 1 || distance === total - 1;
          const slideTitle = slide.event_title || slide.atrativo_style || slide.category || "Evento";
          const slideImage = slide.image_url || getEventFallbackImage(slide.category);
          const slideLocation = [slide.location, slide.address_neighborhood].filter(Boolean).join(" · ");
          return (
            <Button
              key={slide.id}
              type="button"
              variant="ghost"
              onClick={(event) => {
                // Embla cancels clicks following a drag before they reach React.
                if (event.defaultPrevented) return;
                const flyer = event.target instanceof Element ? event.target.closest("[data-flyer]") : null;
                if (event.detail > 0 && flyer) {
                  const bounds = flyer.getBoundingClientRect();
                  const position = (event.clientX - bounds.left) / bounds.width;
                  if (total > 1 && position < 0.32) {
                    goTo(index - 1);
                    return;
                  }
                  if (total > 1 && position > 0.68) {
                    goTo(index + 1);
                    return;
                  }
                }
                onOpenEvent(slide.id);
              }}
              tabIndex={active ? 0 : -1}
              aria-hidden={!active}
              aria-label={`Abrir evento ${slideTitle}`}
              className="block h-auto min-w-0 flex-[0_0_100%] select-none whitespace-normal rounded-none p-0 text-left hover:bg-background md:h-auto"
            >
              <div data-flyer className="relative h-[min(60vh,42rem)] w-full overflow-hidden bg-muted">
                {near && <img src={slideImage} alt="" aria-hidden="true" draggable={false} decoding="async" loading={active ? "eager" : "lazy"} fetchPriority="low" className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover object-center blur-xl" />}
                <div aria-hidden="true" className="absolute inset-0 bg-background/30" />
                {near && <img src={slideImage} alt={slideTitle} draggable={false} decoding="async" loading={active ? "eager" : "lazy"} fetchPriority={slideIndex === 0 && active ? "high" : "low"} onError={(event) => { const fallback = getEventFallbackImage(slide.category); if (event.currentTarget.getAttribute("src") !== fallback) event.currentTarget.src = fallback; }} className="relative h-full w-full object-contain object-center" />}
                {active && (
                  <span className="pointer-events-none absolute bottom-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-primary/70 bg-background/90 px-4 py-2 text-xs font-bold uppercase text-foreground shadow-lg backdrop-blur-sm">
                    <Eye className="h-4 w-4 text-primary" aria-hidden="true" /> Ver detalhes
                  </span>
                )}
              </div>
              <div className="mx-auto flex min-h-[9.5rem] w-full max-w-6xl flex-col justify-center px-4 py-5 text-center text-foreground sm:px-8">
                <h2 className="line-clamp-2 mx-auto max-w-3xl break-words font-display uppercase text-2xl font-bold leading-tight sm:text-4xl">{slideTitle}</h2>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 justify-center text-sm text-muted-foreground">
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


      </div>
      {(item.location || item.atrativo_style) && (
        <p className="mx-auto mt-2 max-w-6xl truncate px-4 text-center font-display text-sm font-semibold uppercase tracking-wide text-primary sm:text-base">
          {item.location || item.atrativo_style}
        </p>
      )}

    </section>
  );
}