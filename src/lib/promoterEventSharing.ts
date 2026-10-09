import { eventDateISO, isCurrentOrFutureEventDate, PUBLIC_EVENT_STATUSES } from "@/lib/eventDate";
import { formatBrazilianDate } from "@/lib/date-utils";

export interface PromoterShareEvent {
  id: string;
  user_id: string | null;
  slug: string | null;
  event_title: string | null;
  date: string | null;
  start_time: string | null;
  location: string | null;
  address_street: string | null;
  address_neighborhood: string | null;
  description: string | null;
  image_url: string | null;
  status: string | null;
}

export function eligiblePromoterEvents(events: PromoterShareEvent[], ownerId: string | undefined, today?: string) {
  if (!ownerId) return [];
  return events.filter(event => event.user_id === ownerId && PUBLIC_EVENT_STATUSES.includes(event.status as typeof PUBLIC_EVENT_STATUSES[number]) && isCurrentOrFutureEventDate(event.date, today));
}

export function buildPromoterEventShare(event: PromoterShareEvent, origin: string) {
  const title = event.event_title?.trim() || event.location?.trim() || "Evento";
  const date = eventDateISO(event.date);
  const location = [event.location, event.address_street, event.address_neighborhood].filter(Boolean).join(" — ");
  const description = event.description?.replace(/\s+/g, " ").trim() || "";
  const brief = description.length > 280 ? `${description.slice(0, 277).trimEnd()}…` : description;
  const url = `${new URL(origin).origin}/evento/${encodeURIComponent(event.slug || event.id)}`;
  const text = [
    `*${title}*`,
    date ? `📅 ${formatBrazilianDate(date)}${event.start_time ? ` · ${event.start_time.slice(0, 5)}` : ""}` : "",
    location ? `📍 ${location}` : "",
    brief ? `\n${brief}` : "",
    `\nMais informações: ${url}`,
  ].filter(Boolean).join("\n");
  return { title, text, url };
}