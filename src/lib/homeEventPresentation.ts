import { hasEventFlyer, type HighlightFields } from "@/lib/highlights";

/** Admission price and highlight status never substitute for a real flyer. */
export function splitHomeEventPresentation<T extends HighlightFields>(events: T[]) {
  return {
    visual: events.filter(hasEventFlyer),
    textOnly: events.filter(event => !hasEventFlyer(event)),
  };
}