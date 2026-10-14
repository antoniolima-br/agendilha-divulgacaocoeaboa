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

/** Occupied seven-day windows only; keep the same availability source as the calendar. */
export function eventDayStripWindow(availableDays: ReadonlySet<string>, requestedStart: string, today = saoPauloTodayISO()) {
  const days = [...availableDays].filter(day => day >= today).sort();
  const starts = [...new Set(days.map(day => eventWeekStart(day, today)))];
  const start = starts.includes(requestedStart) ? requestedStart : starts.find(day => day >= requestedStart) ?? starts.at(-1);
  const index = start ? starts.indexOf(start) : -1;
  return {
    days: start ? days.filter(day => day >= start && day <= addDaysToISO(start, 6)) : [],
    previous: index > 0 ? starts[index - 1] : undefined,
    next: index >= 0 ? starts[index + 1] : undefined,
  };
}