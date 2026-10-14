import { eventDateISO, saoPauloTodayISO, isPublicEventStatus } from "@/lib/eventDate";
import { buildEventShareText, ShareableEvent } from "./event-utils";

export interface PromoterShareEvent extends ShareableEvent {
  user_id: string | null;
  status: string | null;
  image_url: string | null;
}

export function eligiblePromoterEvents(events: PromoterShareEvent[], ownerId: string | undefined, today = saoPauloTodayISO()) {
  if (!ownerId) return [];
  return events.filter(event => event.user_id === ownerId && isPublicEventStatus(event.status) && eventDateISO(event.date) >= today);
}

export function buildPromoterEventShare(event: PromoterShareEvent, origin: string) {
  const url = `${new URL(origin).origin}/evento/${encodeURIComponent(event.slug || event.id)}?src=whatsapp`;
  const text = buildEventShareText(event, {
    includeBrief: true,
    url: `\nMais informações: ${url}`
  });
  
  return {
    title: event.event_title || event.location || "Evento",
    text,
    url,
  };
}
