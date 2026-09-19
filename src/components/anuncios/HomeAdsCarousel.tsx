import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ImageIcon, MapPin, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SponsoredAdDialog } from "@/components/anuncios/SponsoredAdDialog";
import { useAdCoverUrl } from "@/data/useAdPhotoUrls";
import { usePublishedAds } from "@/data/useAds";
import type { Ad } from "@/data/useAds";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const AUTOPLAY_MS = 4_000;
const MAX_SPONSORED_ADS = 6;

function SponsoredSlide({ ad, onOpen }: { ad: Ad; onOpen: () => void }) {
  const cover = useAdCoverUrl(ad.photos);
  const location = [ad.neighborhood, ad.city].filter(Boolean).join(" · ");

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onOpen}
      className="group relative h-auto w-full overflow-hidden rounded-lg border bg-card p-0 text-left shadow-sm hover:bg-card hover:shadow-md"
      aria-label={`Abrir detalhes do anúncio ${ad.title}`}
    >
      <div className="aspect-video w-full bg-muted">
        {cover ? (
          <img src={cover} alt={ad.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ImageIcon className="h-10 w-10" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-background/95 p-4 backdrop-blur-sm">
        <Badge variant="secondary" className="mb-2">Patrocinado</Badge>
        <h3 className="line-clamp-1 text-base font-bold text-foreground sm:text-lg">{ad.title}</h3>
        {location && (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{location}</span>
          </p>
        )}
      </div>
    </Button>
  );
}

export function HomeAdsCarousel() {
  const { data: ads = [], isLoading } = usePublishedAds();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  const visibleAds = ads.slice(0, MAX_SPONSORED_ADS);
  const total = visibleAds.length;
  const goTo = useCallback((next: number) => {
    setIndex(total ? (next + total) % total : 0);
  }, [total]);

  useEffect(() => {
    if (paused || reduceMotion || total < 2) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % total), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [paused, reduceMotion, total]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (index >= total) setIndex(0);
  }, [index, total]);

  if (isLoading || total === 0) return null;
  const currentAd = visibleAds[index];
  if (!currentAd) return null;

  const openDetails = (ad: Ad) => {
    setPaused(true);
    setSelectedAd(ad);
    void supabase.rpc("increment_ad_views", { target_ad_id: ad.id });
  };

  return (
    <section className="mb-12" aria-label="Anúncios da Ilha">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-2xl font-bold">
          <ShoppingBag className="h-5 w-5 text-primary" />
          Anúncios da Ilha
        </h2>
        <Button asChild variant="link" className="shrink-0 px-0 font-bold">
          <Link to="/anuncios">Ver todos</Link>
        </Button>
      </div>

      <div
        className="relative"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <div className="mx-auto max-w-3xl" aria-live="polite">
          <SponsoredSlide ad={currentAd} onOpen={() => openDetails(currentAd)} />
        </div>

        {total > 1 && (
          <>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute left-0 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full shadow-sm sm:-left-3"
              onClick={() => goTo(index - 1)}
              aria-label="Anúncio anterior"
            >
              <ChevronLeft />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute right-0 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full shadow-sm sm:-right-3"
              onClick={() => goTo(index + 1)}
              aria-label="Próximo anúncio"
            >
              <ChevronRight />
            </Button>
            <div className="mt-4 flex justify-center gap-2" aria-label="Escolher anúncio">
              {visibleAds.map((ad, dotIndex) => (
                <Button
                  key={ad.id}
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full p-0"
                  onClick={() => goTo(dotIndex)}
                  aria-label={`Ver anúncio ${dotIndex + 1}`}
                  aria-current={dotIndex === index ? "true" : undefined}
                >
                  <span className={cn("h-2 rounded-full bg-muted-foreground/30 transition-all", dotIndex === index ? "w-5 bg-primary" : "w-2")} />
                </Button>
              ))}
            </div>
          </>
        )}
      </div>

      <SponsoredAdDialog
        ad={selectedAd}
        open={Boolean(selectedAd)}
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