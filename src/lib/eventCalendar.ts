import { eventDateISO, isPublicEventStatus, saoPauloTodayISO } from "@/lib/eventDate";
import { matchesPublicEventFilters, type FilterableEvent, type PublicEventFilters } from "@/lib/publicEventFilters";

type CalendarEvent = FilterableEvent & { status?: string | null };

export function availableEventDays(events: readonly CalendarEvent[], filters: PublicEventFilters, today = saoPauloTodayISO()): Set<string> {
  const days = new Set<string>();
  const calendarFilters: PublicEventFilters = { ...filters, date: "", period: "all" };
  for (const event of events) {
    if (!isPublicEventStatus(event.status) || !matchesPublicEventFilters(event, calendarFilters, "", today)) continue;
    const day = eventDateISO(event.date);
    if (day) days.add(day);
  }
  return days;
}