import { Card, CardContent } from "@/components/ui/card";
import { EventShareButton } from "@/components/EventShareButton";
import { FavoriteButton } from "@/components/FavoriteButton";
import { EventImage } from "./EventImage";
import { getShareData } from "@/lib/sharing";
import type { AgendaEvent } from "./types";

interface RecommendationCardProps {
  event: AgendaEvent;
  icon: any;
  caption: string;
  onSelect: (ev: AgendaEvent) => void;
  onShare: (title: string, text: string, url: string, eventId?: string) => void;
}

export function RecommendationCard({
  event: ev,
  icon,
  caption,
  onSelect,
}: RecommendationCardProps) {
  const shareData = getShareData(ev);
  return (
    <Card
      className="overflow-hidden border border-border bg-card hover:bg-muted/50 hover:border-accent transition-all duration-300 cursor-pointer group event-card rounded-2xl shadow-none"
      data-event-id={ev.id}
      onClick={() => onSelect(ev)}
    >
      <CardContent className="p-3 flex items-center gap-4">
        <EventImage
          src={ev.image_url}
          alt={ev.event_title}
          category={ev.category}
          className="h-16 w-16 rounded-2xl shrink-0 event-image ring-1 ring-border"
          icon={icon}
        />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm truncate">{ev.event_title}</p>
          <p className="text-xs text-muted-foreground">{caption}</p>
        </div>
        <div className="flex flex-col gap-1 shrink-0 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity z-30">
          <FavoriteButton eventId={ev.id} className="h-8 w-8" />
          <EventShareButton {...shareData} compact className="h-8 w-8 rounded-full border border-border bg-background/80 backdrop-blur-md text-foreground hover:bg-background" />
        </div>
      </CardContent>
    </Card>
  );
}