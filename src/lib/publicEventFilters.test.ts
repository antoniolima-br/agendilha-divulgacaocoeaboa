import { describe, it, expect } from "vitest";
import { DEFAULT_EVENT_FILTERS, matchesPublicEventFilters, matchesEventPeriod } from "./publicEventFilters";
import { clearGlobalEventFilters, getGlobalEventFilters, setGlobalEventFilters } from "@/hooks/useGlobalEventFilters";
const today = "2026-10-09";
const event = { date: "2026-10-10", category: "Música", address_neighborhood: "Olaria", address_city: "Rio de Janeiro", is_highlight: true };
describe("global public filters", () => {
  it("never bypasses macro-region for highlighted or paid events", () => {
    expect(matchesPublicEventFilters(event, { ...DEFAULT_EVENT_FILTERS, region: "Zona Norte" }, "", today)).toBe(true);
    expect(matchesPublicEventFilters(event, { ...DEFAULT_EVENT_FILTERS, region: "Zona Sul" }, "", today)).toBe(false);
  });
  it("never bypasses category for highlighted events", () => {
    expect(matchesPublicEventFilters(event, { ...DEFAULT_EVENT_FILTERS, category: "musica" }, "", today)).toBe(true);
    expect(matchesPublicEventFilters(event, { ...DEFAULT_EVENT_FILTERS, category: "cultura" }, "", today)).toBe(false);
  });
  it("never bypasses selected date for highlighted events", () => {
    expect(matchesPublicEventFilters(event, { ...DEFAULT_EVENT_FILTERS, period: "custom", date: "2026-10-10" }, "", today)).toBe(true);
    expect(matchesPublicEventFilters(event, { ...DEFAULT_EVENT_FILTERS, period: "custom", date: "2026-10-11" }, "", today)).toBe(false);
  });
  it("uses São Paulo calendar at the UTC day boundary", () => {
    expect(matchesEventPeriod("2026-10-10T01:00:00Z", { period: "today", date: "" }, today)).toBe(true);
    expect(matchesEventPeriod("2026-10-09", { period: "all", date: "" }, "2026-10-10")).toBe(false);
  });
  it("keeps Sunday in the current weekend", () => {
    expect(matchesEventPeriod("2026-10-11", { period: "weekend", date: "" }, "2026-10-11")).toBe(true);
    expect(matchesEventPeriod("2026-10-18", { period: "weekend", date: "" }, "2026-10-11")).toBe(false);
  });
  it("preserves filters between surfaces and clears old neighborhood when region changes", () => {
    clearGlobalEventFilters();
    setGlobalEventFilters({ region: "Zona Norte", neighborhood: "Olaria", category: "musica", period: "custom", date: "2026-10-10" });
    expect(getGlobalEventFilters()).toEqual({ region: "Zona Norte", neighborhood: "Olaria", category: "musica", period: "custom", date: "2026-10-10" });
    setGlobalEventFilters({ region: "Zona Sul" });
    expect(getGlobalEventFilters().neighborhood).toBe("all");
    expect(getGlobalEventFilters().category).toBe("musica");
    clearGlobalEventFilters();
  });
});
