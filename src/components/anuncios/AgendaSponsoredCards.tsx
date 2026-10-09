import { usePublishedAds } from "@/data/useAds";
import { AdCard } from "@/components/anuncios/AdCard";

export function AgendaSponsoredCards({ region }: { region: string }) {
  const { data: ads = [] } = usePublishedAds(region, "agenda_card");
  if (!ads.length) return null;
  return <aside aria-label="Parceiros da região" className="space-y-3">{ads.slice(0, 2).map((ad) => <AdCard key={ad.id} ad={ad} sponsored />)}</aside>;
}