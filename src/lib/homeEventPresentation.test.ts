import { describe, expect, it } from "vitest";
import { orderHomeFlyersChronologically, splitHomeEventPresentation } from "./homeEventPresentation";

describe("Home event presentation", () => {
  it("keeps every event without media exclusively in the textual collection", () => {
    const rows = [null, "", "   ", undefined].map((image_url, id) => ({ id, image_url, is_free: false, is_highlight: true }));
    const split = splitHomeEventPresentation(rows);
    expect(split.visual).toEqual([]);
    expect(split.textOnly.map(e => e.id)).toEqual([0, 1, 2, 3]);
  });
  it("preserves real flyers even for free-admission events", () => {
    const rows = [{ id: "flyer", image_url: "https://example.org/flyer.jpg", is_free: true }, { id: "text", image_url: null, is_free: true }];
    const split = splitHomeEventPresentation(rows);
    expect(split.visual.map(e => e.id)).toEqual(["flyer"]);
    expect(split.textOnly.map(e => e.id)).toEqual(["text"]);
  });
  it("never truncates the textual collection to eight events", () => {
    expect(splitHomeEventPresentation(Array.from({ length: 12 }, (_, id) => ({ id, image_url: null }))).textOnly).toHaveLength(12);
  });
  it("includes today's sponsored and unsponsored flyers without future flyers", () => {
    const rows = [
      { id: "paid", date: "2026-10-14", image_url: "/paid.jpg", is_highlight: true },
      { id: "free", date: "14/10/2026", image_url: "/free.jpg", is_highlight: false },
      { id: "text", date: "2026-10-14", image_url: null },
      { id: "future", date: "2026-10-15", image_url: "/future.jpg" },
    ];
    const split = splitHomeEventPresentation(rows, "2026-10-14");
    expect(split.textOnly.map(e => e.id)).toEqual(["paid", "free", "text"]);
    expect(split.visual.map(e => e.id)).toEqual(["paid", "free", "future"]);
  });

});

describe("Home flyer chronology", () => {
  it("places the nearest day first and orders the same day by start time", () => {
    const rows = [
      { id: "later-day", date: "2026-10-16", start_time: "10:00" },
      { id: "later-hour", date: "14/10/2026", start_time: "21:00" },
      { id: "nearer-hour", date: "2026-10-14", start_time: "18:30" },
      { id: "tomorrow", date: "2026-10-15", start_time: "09:00" },
    ];
    expect(orderHomeFlyersChronologically(rows).map((event) => event.id)).toEqual([
      "nearer-hour", "later-hour", "tomorrow", "later-day",
    ]);
  });

  it("keeps the original order when date and time are equal", () => {
    const rows = [
      { id: "first", date: "2026-10-14", start_time: "20:00" },
      { id: "second", date: "2026-10-14", start_time: "20:00" },
      { id: "without-time", date: "2026-10-14", start_time: null },
    ];
    expect(orderHomeFlyersChronologically(rows).map((event) => event.id)).toEqual([
      "first", "second", "without-time",
    ]);
  });
});