import { ExternalLink, ImageIcon, MapPin, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdCoverUrl } from "@/data/useAdPhotoUrls";
import { formatPriceBRL } from "@/data/useAdPlans";
import type { Ad } from "@/data/useAds";
import { getSponsoredAdCreative } from "@/lib/sponsoredAdCreatives";
import { buildWhatsappUrl } from "@/lib/whatsapp";

interface SponsoredAdDialogProps {
  ad: Ad | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SponsoredAdDialog({ ad, open, onOpenChange }: SponsoredAdDialogProps) {
  const cover = useAdCoverUrl(ad?.photos ?? []);
  if (!ad) return null;
  const displayImage = getSponsoredAdCreative(ad.title) || cover;

  const location = [ad.neighborhood, ad.city].filter(Boolean).join(" · ");
  const mapUrl = location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
    : null;
  const whatsappUrl = buildWhatsappUrl(
    ad.contact_whatsapp,
    `Oi! Vi o anúncio “${ad.title}” no Coé a Boa? e queria saber mais.`,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto p-0">
        <div className="aspect-video w-full overflow-hidden bg-muted">
          {displayImage ? (
            <img src={displayImage} alt={ad.title} width={1536} height={864} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <ImageIcon className="h-10 w-10" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <DialogHeader className="pr-7 text-left">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Patrocinado</Badge>
              <Badge variant="outline">{ad.category}</Badge>
            </div>
            <DialogTitle className="text-xl sm:text-2xl">{ad.title}</DialogTitle>
            <DialogDescription className="sr-only">Detalhes e formas de contato do anunciante.</DialogDescription>
          </DialogHeader>

          {ad.price_cents !== null && (
            <p className="text-xl font-black text-primary">{formatPriceBRL(ad.price_cents)}</p>
          )}

          {location && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
              {location}
            </p>
          )}

          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{ad.description}</p>

          <div className="grid gap-2 sm:grid-cols-2">
            {whatsappUrl && (
              <Button asChild className="font-bold">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                  Chamar no WhatsApp
                </a>
              </Button>
            )}
            {mapUrl && (
              <Button asChild variant="outline">
                <a href={mapUrl} target="_blank" rel="noopener noreferrer">
                  <MapPin className="mr-2 h-4 w-4" aria-hidden="true" />
                  Ver localização
                </a>
              </Button>
            )}
            <Button asChild variant="ghost" className="sm:col-span-2">
              <Link to={`/anuncios/${ad.id}`}>
                <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
                Ver anúncio completo
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}