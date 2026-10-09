import { addDaysToISO, eventDateISO, saoPauloTodayISO } from "./eventDate.ts";
import { matchesEventGeography, matchesEventSearch, normalizeGeography } from "./regions.ts";
export type EventPeriod = "all" | "today" | "tomorrow" | "weekend" | "next7" | "custom" | "free" | "kids";
export interface PublicEventFilters { region: string; neighborhood: string; category: string; period: EventPeriod; date: string; }
export const DEFAULT_EVENT_FILTERS: PublicEventFilters = { region: "all", neighborhood: "all", category: "all", period: "all", date: "" };
export interface FilterableEvent { date?: string | null; category?: string | null; address_neighborhood?: string | null; address_city?: string | null; event_title?: string | null; description?: string | null; location?: string | null; is_free?: boolean | null; is_suitable_for_minors?: boolean | null; age_rating?: string | null; }
export function matchesEventCategory(category: string | null | undefined, selected: string): boolean {
  const canonical = (value: string) => { const key = normalizeGeography(value); if (["musica", "show", "shows"].includes(key)) return "musica"; return key === "teatro" ? "cultura" : key; };
  return selected === "all" || canonical(category ?? "") === canonical(selected);
}
export function matchesEventPeriod(date: string | null | undefined, filters: Pick<PublicEventFilters, "period" | "date">, today = saoPauloTodayISO()): boolean {
  const day = eventDateISO(date);
  if (!day || day < today) return false;
  switch (filters.period) {
    case "today": return day === today;
    case "tomorrow": return day === addDaysToISO(today, 1);
    case "custom": return !filters.date || day === filters.date;
    case "next7": return day <= addDaysToISO(today, 7);
    case "weekend": { const weekday = new Date(`${today}T12:00:00Z`).getUTCDay(); const saturday = addDaysToISO(today, weekday === 0 ? -1 : (6 - weekday + 7) % 7); return day >= saturday && day <= addDaysToISO(saturday, 1); }
    default: return true;
  }
}
export function matchesPublicEventFilters(event: FilterableEvent, filters: PublicEventFilters, search = "", today = saoPauloTodayISO()): boolean {
  return matchesEventPeriod(event.date, filters, today) && matchesEventGeography(event, filters.region, filters.neighborhood) && matchesEventCategory(event.category, filters.category) && matchesEventSearch(event, search)
    && (filters.period !== "free" || event.is_free === true) && (filters.period !== "kids" || event.is_suitable_for_minors === true || event.age_rating === "Livre");
}
