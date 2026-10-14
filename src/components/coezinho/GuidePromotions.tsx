import { useGlobalEventFilters } from "@/hooks/useGlobalEventFilters";
import { usePublishedAds } from "@/data/useAds";
import { AdCard } from "@/components/anuncios/AdCard";

export function GuidePromotions() {
  const { filters } = useGlobalEventFilters();
  const { data = [] } = usePublishedAds(filters.region, "carousel");
  const promotions = data.filter((ad) => ad.is_highlight).slice(0, 2);
  if (!promotions.length) return null;
  return (
    <section aria-labelledby="guide-promotions-title" className="space-y-3 border-t border-border pt-5">
      <h3 id="guide-promotions-title" className="text-xs font-bold uppercase text-muted-foreground">Parceiros em destaque</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {promotions.map((ad) => <AdCard key={ad.id} ad={ad} sponsored />)}
      </div>
    </section>
  );
}