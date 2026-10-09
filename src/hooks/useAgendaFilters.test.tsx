import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearGlobalEventFilters } from "./useGlobalEventFilters";
import { useAgendaFilters } from "@/hooks/useAgendaFilters";
import type { AgendaEvent } from "@/components/agenda/types";

vi.mock("../../supabase/functions/_shared/eventDate", async () => {
  const actual = await vi.importActual<typeof import("../../supabase/functions/_shared/eventDate")>("../../supabase/functions/_shared/eventDate");
  return {
    ...actual,
    saoPauloTodayISO: () => "2026-09-22",
    isCurrentOrFutureEventDate: (value?: string | null) => {
      const date = actual.eventDateISO(value);
      return date !== "" && date >= "2026-09-22";
    },
  };
});

function event(id: string, date: string | null): AgendaEvent {
  return {
    id,
    date,
    event_title: id,
    start_time: "20:00",
    end_time: null,
    location: null,
    address_neighborhood: null,
    address_street: null,
    description: null,
    category: null,
    company_name: null,
    is_highlight: false,
  };
}

describe("useAgendaFilters", () => {
  beforeEach(() => { localStorage.clear(); clearGlobalEventFilters(); });

  it("busca bairro e região sem acentos ou distinção de caixa", () => {
    const { result } = renderHook(() => useAgendaFilters({ events: [
      { ...event("olaria-sabado", "2026-09-26"), address_neighborhood: "Olaria (#) Rio de Janeiro, RJ, Brasil" },
      { ...event("ramos", "2026-09-26"), address_neighborhood: "rAmOs" },
      { ...event("bonsucesso", "2026-09-26"), address_neighborhood: "Bonsucesso" },
      { ...event("penha", "2026-09-26"), address_neighborhood: "PENHA" },
      { ...event("bras", "2026-09-26"), address_neighborhood: "Brás de Pina" },
      { ...event("tijuca", "2026-09-26"), address_neighborhood: "Tijuca" },
    ], profile: null, isFavorite: () => false, favorites: [] }));
    act(() => result.current.setRegionFilter("zona norte"));
    expect(result.current.filteredEvents.map((e) => e.id)).toEqual(["olaria-sabado", "ramos", "bonsucesso", "penha", "bras"]);
    act(() => result.current.setSearch("  olaria "));
    expect(result.current.filteredEvents.map((e) => e.id)).toEqual(["olaria-sabado"]);
    act(() => result.current.setSearch("BRAS DE PINA"));
    expect(result.current.filteredEvents.map((e) => e.id)).toEqual(["bras"]);
    act(() => result.current.setSearch("ZONA NORTE"));
    expect(result.current.filteredEvents).toHaveLength(5);
  });

  it("encontra Olaria na Zona Norte sem perder eventos de sábado", () => {
    const { result } = renderHook(() => useAgendaFilters({ events: [{ ...event("olaria-sabado", "2026-09-26"), address_neighborhood: "Olaria" }, { ...event("tijuca", "2026-09-26"), address_neighborhood: "Tijuca" }], profile: null, isFavorite: () => false, favorites: [] }));
    act(() => result.current.setRegionFilter("Zona Norte"));
    expect(result.current.filteredEvents.map((e) => e.id)).toEqual(["olaria-sabado"]);
  });

  it("filtra por macro-região e limpa a seleção", () => {
    const { result } = renderHook(() => useAgendaFilters({ events: [{ ...event("tijuca", "2026-09-23"), address_neighborhood: "Tijuca" }, { ...event("taquara", "2026-09-23"), address_neighborhood: "Taquara" }], profile: null, isFavorite: () => false, favorites: [] }));
    act(() => result.current.setRegionFilter("Grande Tijuca"));
    expect(result.current.filteredEvents.map((e) => e.id)).toEqual(["tijuca"]);
    expect(result.current.hasActiveFilters).toBe(true);
    act(() => result.current.clearFilters());
    expect(result.current.regionFilter).toBe("all");
    expect(result.current.filteredEvents).toHaveLength(2);
  });

  it("mantém hoje e o futuro, excluindo passado e datas inválidas", () => {
    const { result } = renderHook(() => useAgendaFilters({
      events: [
        event("ontem", "2026-09-21"),
        event("hoje", "2026-09-22"),
        event("futuro", "2026-10-10"),
        event("invalido", "2026-02-30"),
        event("sem-data", null),
      ],
      profile: null,
      isFavorite: () => false,
      favorites: [],
    }));

    expect(result.current.upcomingEvents.map((item) => item.id)).toEqual(["hoje", "futuro"]);
  });

  it("continua aplicando busca e categoria somente sobre eventos futuros", () => {
    const { result } = renderHook(() => useAgendaFilters({
      events: [
        { ...event("show-futuro", "2026-09-23"), event_title: "Samba na Ilha", category: "musica" },
        { ...event("passado", "2026-09-20"), event_title: "Samba antigo", category: "musica" },
      ],
      profile: null,
      isFavorite: () => false,
      favorites: [],
    }));

    act(() => result.current.setSearch("samba"));
    act(() => result.current.setCategoryFilter("musica"));

    expect(result.current.filteredEvents.map((item) => item.id)).toEqual(["show-futuro"]);
  });

  it("separa eventos com flyer como destaques promocionais mesmo sem ativação manual", () => {
    const flyer = { ...event("com-flyer", "2026-09-23"), is_free: true, image_url: "https://cdn/flyer.webp" };
    const semFlyer = { ...event("sem-flyer", "2026-09-23"), is_free: true };
    const { result } = renderHook(() => useAgendaFilters({
      events: [flyer, semFlyer],
      profile: null,
      isFavorite: () => false,
      favorites: [],
    }));

    expect(result.current.filteredEvents.filter((item) => Boolean(item.image_url)).map((item) => item.id)).toEqual(["com-flyer"]);
    expect(result.current.freeEvents.map((item) => item.id)).toEqual(["sem-flyer"]);
    expect(Object.values(result.current.grouped).flatMap((group) => group.items.map((item) => item.id))).toEqual([]);
  });

  it("destaques e recomendações respeitam região, categoria e data juntas", () => {
    const { result } = renderHook(() => useAgendaFilters({ events: [
      { ...event("sul", "2026-09-26"), address_neighborhood: "Copacabana", category: "musica", is_highlight: true, views_count: 100 },
      { ...event("norte", "2026-09-26"), address_neighborhood: "Olaria", category: "musica", is_highlight: true },
      { ...event("outra-data", "2026-09-27"), address_neighborhood: "Olaria", category: "musica", is_highlight: true },
      { ...event("outra-categoria", "2026-09-26"), address_neighborhood: "Olaria", category: "cultura", is_highlight: true },
    ], profile: { musical_preferences: ["musica"] }, isFavorite: () => false, favorites: [] }));
    act(() => { result.current.setRegionFilter("Zona Norte"); result.current.setCategoryFilter("musica"); result.current.setDate("2026-09-26"); });
    expect(result.current.filteredEvents.map((e) => e.id)).toEqual(["norte"]);
    expect(result.current.trendingEvents.map((e) => e.id)).toEqual(["norte"]);
    expect(result.current.recommendedEvents.map((e) => e.id)).toEqual(["norte"]);
  });

  it("não trava quando a lista de eventos ou itens vêm nulos", () => {
    const { result } = renderHook(() => useAgendaFilters({
      events: null as unknown as AgendaEvent[],
      profile: null,
      isFavorite: () => false,
      favorites: null,
    }));
    expect(result.current.upcomingEvents).toEqual([]);
    expect(result.current.filteredEvents).toEqual([]);

    const { result: withNullItems } = renderHook(() => useAgendaFilters({
      events: [null, event("hoje", "2026-09-22"), undefined] as unknown as AgendaEvent[],
      profile: null,
      isFavorite: () => false,
      favorites: [],
    }));
    expect(withNullItems.current.upcomingEvents.map((item) => item.id)).toEqual(["hoje"]);
  });
});
