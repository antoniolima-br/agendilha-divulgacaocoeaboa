import { hasEventFlyer, type HighlightFields } from "@/lib/highlights";
import { eventDateISO, saoPauloTodayISO } from "@/lib/eventDate";

type ChronologicalHomeEvent = {
  date?: string | null;
  start_time?: string | null;
};

/** Orders valid Home flyers by São Paulo calendar day and start time, preserving ties. */
export function orderHomeFlyersChronologically<T extends ChronologicalHomeEvent>(events: readonly T[]): T[] {
  return events
    .map((event, position) => ({ event, position }))
    .sort((a, b) => {
      const dateDifference = eventDateISO(a.event.date).localeCompare(eventDateISO(b.event.date));
      if (dateDifference !== 0) return dateDifference;
      const timeDifference = (a.event.start_time?.trim() || "99:99").localeCompare(
        b.event.start_time?.trim() || "99:99",
      );
      return timeDifference || a.position - b.position;
    })
    .map(({ event }) => event);
}

/** Admission price and highlight status never substitute for a real flyer. */
export function splitHomeEventPresentation<T extends HighlightFields & { date?: string | null }>(events: T[], today = saoPauloTodayISO()) {
  return {
    visual: events.filter(hasEventFlyer),
    textOnly: events.filter(event => !hasEventFlyer(event) || eventDateISO(event.date) === today),
  };
}