import { describe, it, expect } from "vitest";
import { radarEvents } from "./radar";
import type { AgendaEvent } from "@/components/agenda/types";

const now = new Date("2026-10-07T15:00:00Z");
const events = [
  { id: "samba", date: "2026-10-08", category: "musica", description: "Samba ao vivo", address_neighborhood: "Galeão" },
  { id: "rock", date: "2026-10-09", category: "Música", description: "Rock", address_neighborhood: "Ribeira" },
  { id: "past", date: "2020-01-01", category: "Música", description: "Samba", address_neighborhood: "Galeão" },
] as AgendaEvent[];
describe("personal radar", () => {
  it("filters macro-regions and unions specific neighborhoods", () => {
    const extended = [...events, { id: "tijuca", date: "2026-10-08", address_neighborhood: "Tijuca" }] as AgendaEvent[];
    expect(radarEvents(extended, { followed_regions: ["Grande Tijuca"] }, now).map((e) => e.id)).toEqual(["tijuca"]);
    expect(radarEvents(extended, { followed_regions: ["Grande Tijuca"], followed_neighborhoods: ["Ribeira"] }, now).map((e) => e.id)).toEqual(["tijuca", "rock"]);
  });
  it("combines interests and neighborhoods with accent-insensitive matching", () => {
    expect(radarEvents(events, { musical_preferences: ["samba"], followed_neighborhoods: ["Galeao"] }, now).map((event) => event.id)).toEqual(["samba"]);
  });
  it("keeps only upcoming events with no preferences and tolerates null preferences", () => {
    expect(radarEvents(events, { musical_preferences: null as unknown as string[] }, now)).toHaveLength(2);
  });
  it("never mutates the shared public events array", () => {
    const before = JSON.stringify(events);
    radarEvents(events, {}, now);
    expect(JSON.stringify(events)).toBe(before);
  });
});