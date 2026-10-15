import { describe, expect, it } from "vitest";
import { eventBatchIds } from "./pagedPublicEvents";

describe("bounded event detail pages", () => {
  const events = Array.from({ length: 33 }, (_, index) => ({ id: `event-${index}` }));
  it("loads the first 15 without fetching the entire collection", () => {
    expect(eventBatchIds(events, 0)).toEqual(events.slice(0, 15).map(event => event.id));
  });
  it("loads the next 15 with no duplicates or omitted boundary event", () => {
    expect(eventBatchIds(events, 1)).toEqual(events.slice(15, 30).map(event => event.id));
  });
  it("keeps the final partial page and ends cleanly", () => {
    expect(eventBatchIds(events, 2)).toEqual(["event-30", "event-31", "event-32"]);
    expect(eventBatchIds(events, 3)).toEqual([]);
  });
});