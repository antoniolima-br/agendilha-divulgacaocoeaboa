import { addDaysToISO, eventDateISO, isPublicEventStatus, saoPauloTodayISO } from "@/lib/eventDate";
import { matchesPublicEventFilters, type FilterableEvent, type PublicEventFilters } from "@/lib/publicEventFilters";

type CalendarEvent = FilterableEvent & { status?: string | null };

export function eventWeekStart(day: string, today = saoPauloTodayISO()): string {
  const offset = Math.round((Date.parse(`${day}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86_400_000);
  return addDaysToISO(today, Math.floor(offset / 7) * 7);
}

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

/** Five occupied dates; week anchors remain compatible with flyer focus. */
export function eventDayStripWindow(availableDays: ReadonlySet<string>, requestedStart: string, today = saoPauloTodayISO()) {
  const days = [...availableDays].filter(day => day >= today).sort();
  const found = days.findIndex(day => day >= requestedStart);
  const index = found >= 0 ? found : Math.max(0, days.length - 5);
  const start = Math.min(index, Math.max(0, days.length - 5));
  return {
    days: days.slice(start, start + 5),
    previous: start > 0 ? days[Math.max(0, start - 5)] : undefined,
    next: start + 5 < days.length ? days[Math.min(start + 5, days.length - 5)] : undefined,
  };
}