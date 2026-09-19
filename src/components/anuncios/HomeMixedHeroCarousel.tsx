import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ImageIcon, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SponsoredAdDialog } from "@/components/anuncios/SponsoredAdDialog";
import { useAdCoverUrl } from "@/data/useAdPhotoUrls";
import { usePublishedAds, type Ad } from "@/data/useAds";
import { useEventFlyerFallbacks } from "@/data/useEventFlyerFallbacks";
import { getEventFallbackImage } from "@/lib/event-utils";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const AUTOPLAY_MS = 4_000;

interface HeroEvent {
  id: string;
  event_title: string | null;
  date: string | null;
  start_time: string | null;
  location: string | null;
  address_neighborhood: string | null;
  category: string | null;
  image_url?: string | null;
}

type HeroItem =
  | { key: string; kind: "event"; event: HeroEvent }
  | { key: string; kind: "ad"; ad: Ad };

function SponsorImage({ ad, fallbackImage }: { ad: Ad; fallbackImage?: string }) {
  const cover = useAdCoverUrl(ad.photos);
  const displayImage = cover || fallbackImage;
  return displayImage ? (
    <img src={displayImage} alt={ad.title} className="h-full w-full object-cover" />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
      <ImageIcon className="h-12 w-12" aria-hidden="true" />
    </div>
  );
}

export function HomeMixedHeroCarousel({
  events,
  onOpenEvent,
}: {
  events: HeroEvent[];
  onOpenEvent: (id: string) => void;
}) {
  const { data: ads = [] } = usePublishedAds();
  const { data: eventFlyers = [] } = useEventFlyerFallbacks(6);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);

  const items = useMemo<HeroItem[]>(() => {
    const eventItems = events.slice(0, 3).map((event) => ({
      key: `event-${event.id}`,
      kind: "event" as const,
      event,
    }));
    const adItems = ads.slice(0, 3).map((ad) => ({ key: `ad-${ad.id}`, kind: "ad" as const, ad }));
    const mixed: HeroItem[] = [];
    const length = Math.max(eventItems.length, adItems.length);
    for (let position = 0; position < length; position += 1) {
      const event = eventItems[position];
      const ad = adItems[position];
      if (event) mixed.push(event);
      if (ad) mixed.push(ad);
    }
    return mixed;
  }, [ads, events]);

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
    if (item.kind === "event") {
      onOpenEvent(item.event.id);
      return;
    }
    setPaused(true);
    setSelectedAd(item.ad);
    void supabase.rpc("increment_ad_views", { target_ad_id: item.ad.id });
  };

  const title = item.kind === "ad" ? item.ad.title : item.event.event_title || "Evento";
  const location = item.kind === "ad"
    ? [item.ad.neighborhood, item.ad.city].filter(Boolean).join(" · ")
    : [item.event.location, item.event.address_neighborhood].filter(Boolean).join(" · ");
  const eventImage = item.kind === "event"
    ? item.event.image_url || getEventFallbackImage(item.event.category)
    : null;
  const adIndex = item.kind === "ad" ? ads.findIndex((ad) => ad.id === item.ad.id) : -1;
  const sponsorFallbackImage = adIndex >= 0 && eventFlyers.length > 0
    ? eventFlyers[adIndex % eventFlyers.length]
    : undefined;

  return (
    <section
      className="mb-12"
      aria-label="Destaques da Ilha"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="relative overflow-hidden rounded-lg border bg-card shadow-sm">
        <Button
          type="button"
          variant="ghost"
          onClick={openCurrent}
          className="group relative block h-auto w-full rounded-none p-0 text-left hover:bg-card"
          aria-label={`${item.kind === "ad" ? "Abrir anúncio" : "Abrir evento"} ${title}`}
        >
          <div className="aspect-[16/11] w-full overflow-hidden bg-muted sm:aspect-[21/9]">
            {item.kind === "ad" ? (
              <SponsorImage ad={item.ad} fallbackImage={sponsorFallbackImage} />
            ) : (
              <img src={eventImage ?? undefined} alt={title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-background sm:p-8">
            <Badge variant="secondary" className="mb-3">
              {item.kind === "ad" ? "Patrocinado" : "Destaque da Ilha"}
            </Badge>
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
            <Button key={entry.key} type="button" variant="ghost" size="icon" className="h-6 w-6 rounded-full p-0" onClick={() => goTo(dotIndex)} aria-label={`Ver destaque ${dotIndex + 1}`} aria-current={dotIndex === index ? "true" : undefined}>
              <span className={cn("h-2 rounded-full bg-muted-foreground/30 transition-all", dotIndex === index ? "w-5 bg-primary" : "w-2")} />
            </Button>
          ))}
        </div>
      )}

      <SponsoredAdDialog
        ad={selectedAd}
        open={Boolean(selectedAd)}
        fallbackImage={selectedAd && eventFlyers.length > 0
          ? eventFlyers[Math.max(0, ads.findIndex((ad) => ad.id === selectedAd.id)) % eventFlyers.length]
          : undefined}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedAd(null);
            setPaused(false);
          }
        }}
      />
    </section>
  );
}