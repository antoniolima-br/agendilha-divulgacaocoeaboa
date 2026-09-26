import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Clock,
  MapPin,
  MessageCircle,
  Music as MusicIcon,
  Share2,
  Tag,
  Trophy,
  Utensils,
} from "lucide-react";
import { FavoriteButton } from "@/components/FavoriteButton";
import { EventImage } from "./EventImage";
import { buildWhatsAppShare } from "./agenda-utils";
import { categoryIcons, categoryLabels, type AgendaEvent } from "./types";
import { buildFullAddress, getShareData } from "@/lib/sharing";

interface DayEventCardProps {
  event: AgendaEvent;
  onSelect: (ev: AgendaEvent) => void;
  onShare: (title: string, text: string, url: string, eventId?: string) => void;
  trackView: (id: string) => void;
  trackShare: (id: string) => void;
}

export function DayEventCard({
  event: ev,
  onSelect,
  onShare,
  trackView,
  trackShare,
}: DayEventCardProps) {
  const icon = categoryIcons[ev.category || ""] || "📌";
  const IconComp = (ev.category === "musica"
    ? MusicIcon
    : ev.category === "gastronomia"
      ? Utensils
      : ev.category === "esporte"
        ? Trophy
        : ev.category === "promocoes"
          ? Tag
          : CalendarDays) as any;

  const addr = buildFullAddress(ev as any);
  const stop = (fn: () => void) => (e: React.MouseEvent) => { e.stopPropagation(); fn(); };

  return (
    <Card
      className="event-card group cursor-pointer overflow-hidden rounded-2xl border-border/60 bg-card/50 transition-colors hover:border-primary/60"
      data-event-id={ev.id}
      onClick={() => { trackView(ev.id); onSelect(ev); }}
    >
      <CardContent className="flex gap-3 p-2.5 sm:gap-4 sm:p-3">
        <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl sm:h-36 sm:w-32">
          <EventImage src={ev.image_url} alt={ev.event_title} category={ev.category} className="absolute inset-0 h-full w-full event-image" icon={IconComp} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                {icon} {categoryLabels[ev.category!] || ev.category || "Evento"}
              </span>
              <FavoriteButton eventId={ev.id} className="h-8 w-8 shrink-0" />
            </div>
            <h3 className="line-clamp-2 font-semibold leading-snug text-foreground group-hover:text-primary sm:text-lg">{ev.event_title || ev.location || "Evento"}</h3>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground/80"><Clock className="h-3.5 w-3.5 text-primary" />{ev.start_time?.slice(0, 5) || "Horário a confirmar"}</p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{ev.location || addr}</span></p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button size="sm" variant="outline" className="h-9 rounded-full px-3 text-xs" onClick={stop(() => { trackShare(ev.id); window.open(buildWhatsAppShare(ev), "_blank"); })}>
              <MessageCircle className="mr-1 h-3.5 w-3.5" /> WhatsApp
            </Button>
            <Button size="sm" variant="outline" className="h-9 rounded-full px-3 text-xs" onClick={stop(() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`, "_blank"))}>
              <MapPin className="mr-1 h-3.5 w-3.5" /> Mapa
            </Button>
            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full" aria-label="Compartilhar" onClick={stop(() => { const d = getShareData(ev as any); onShare(d.title, d.text, d.url, ev.id); })}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
