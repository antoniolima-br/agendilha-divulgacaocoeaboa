import { hasEventFlyer, type HighlightFields } from "@/lib/highlights";
import { eventDateISO, saoPauloTodayISO } from "@/lib/eventDate";

/** Admission price and highlight status never substitute for a real flyer. */
export function splitHomeEventPresentation<T extends HighlightFields & { date?: string | null }>(events: T[], today = saoPauloTodayISO()) {
  return {
    visual: events.filter(hasEventFlyer),
    textOnly: events.filter(event => !hasEventFlyer(event) || eventDateISO(event.date) === today),
  };
}