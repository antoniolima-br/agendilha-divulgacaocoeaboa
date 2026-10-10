import { describe, expect, it } from "vitest";
import { availableEventDays } from "./eventCalendar";
import { DEFAULT_EVENT_FILTERS } from "./publicEventFilters";

describe("dias disponíveis no calendário", () => {
  const today = "2026-10-10";
  it("habilita uma data com ao menos um evento público e deduplica eventos", () => {
    expect([...availableEventDays([
      { date: today, status: "publicado" }, { date: today, status: "aprovado" },
      { date: "2026-10-11", status: "divulgado" },
    ], DEFAULT_EVENT_FILTERS, today)]).toEqual([today, "2026-10-11"]);
  });
  it("não habilita dias vazios, passados, inválidos ou sem publicação", () => {
    const days = availableEventDays([
      { date: "2026-10-09", status: "publicado" }, { date: "2026-10-11", status: "pendente" },
      { date: "2026-02-30", status: "publicado" }, { date: null, status: "publicado" },
    ], DEFAULT_EVENT_FILTERS, today);
    expect(days.size).toBe(0);
    expect(days.has("2026-10-12")).toBe(false);
  });
  it("respeita região e categoria sem prender o calendário à data selecionada", () => {
    const days = availableEventDays([
      { date: "2026-10-11", status: "publicado", category: "musica", address_neighborhood: "Olaria", address_city: "Rio de Janeiro" },
      { date: "2026-10-12", status: "publicado", category: "cultura", address_neighborhood: "Olaria", address_city: "Rio de Janeiro" },
      { date: "2026-10-13", status: "publicado", category: "musica", address_neighborhood: "Copacabana", address_city: "Rio de Janeiro" },
    ], { ...DEFAULT_EVENT_FILTERS, region: "Zona Norte", category: "musica", period: "custom", date: today }, today);
    expect([...days]).toEqual(["2026-10-11"]);
  });
});