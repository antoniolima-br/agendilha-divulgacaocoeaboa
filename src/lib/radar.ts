import { regionOf } from "./regions";
import type { AgendaEvent } from "@/components/agenda/types";
import type { ProfileAddress } from "@/hooks/useProfile";
import { eventDateISO, isCurrentOrFutureEventDate } from "./eventDate";

export const normalizeRadarText = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
export function radarEvents(events: AgendaEvent[], preferences: Partial<ProfileAddress>, now = new Date()) {
  const strings = (value: unknown): string[] => Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string" && !!entry.trim()) : [];
  const categories = strings(preferences.event_type_preferences).map(normalizeRadarText);
  const styles = strings(preferences.musical_preferences).map(normalizeRadarText);
  const regions = strings(preferences.followed_regions).map(normalizeRadarText);
  const neighborhoods = strings(preferences.followed_neighborhoods).map(normalizeRadarText);
  return events.filter((event) => {
    if (!event || !isCurrentOrFutureEventDate(event.date, now)) return false;
    const text = normalizeRadarText([event.event_title, event.category, event.description].filter(Boolean).join(" "));
    const interest = (!categories.length && !styles.length) || [...categories, ...styles].some((value) => text.includes(value));
    const region = regionOf(event);
    const geography = (!neighborhoods.length && !regions.length) || neighborhoods.includes(normalizeRadarText(event.address_neighborhood || "")) || (region !== null && regions.includes(normalizeRadarText(region)));
    return interest && geography;
  }).sort((a, b) => `${eventDateISO(a.date)} ${a.start_time || ""}`.localeCompare(`${eventDateISO(b.date)} ${b.start_time || ""}`));
}