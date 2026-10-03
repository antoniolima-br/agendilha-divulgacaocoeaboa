import { describe, expect, it } from "vitest";
import {
  highlightDaysLeft,
  highlightStatus,
  isLaunchPromotionalHighlight,
  isHighlightActive,
  pickCarouselEvents,
  prioritizeHomeHeroEvents,
} from "@/lib/highlights";

const now = new Date("2026-09-05T12:00:00Z");
const future = "2026-09-12T12:00:00Z";
const past = "2026-09-01T12:00:00Z";

describe("highlightStatus", () => {
  it("marca como ativo quando o prazo está no futuro", () => {
    expect(highlightStatus({ is_highlight: true, highlight_until: future }, now)).toBe("ativo");
  });

  it("marca como ativo quando não há prazo", () => {
    expect(highlightStatus({ is_highlight: true, highlight_until: null }, now)).toBe("ativo");
  });

  it("marca como expirado quando o prazo passou", () => {
    expect(highlightStatus({ is_highlight: true, highlight_until: past }, now)).toBe("expirado");
  });

  it("marca como escondido mesmo com prazo válido", () => {
    expect(
      highlightStatus({ is_highlight: true, highlight_hidden: true, highlight_until: future }, now),
    ).toBe("escondido");
  });

  it("marca como sem destaque quando a flag está desligada", () => {
    expect(highlightStatus({ is_highlight: false }, now)).toBe("sem_destaque");
  });
});

describe("isHighlightActive", () => {
  it("ignora highlight_active da view quando o prazo já venceu", () => {
    expect(
      isHighlightActive({ is_highlight: true, highlight_active: true, highlight_until: past }, now),
    ).toBe(false);
  });

  it("aceita destaque válido", () => {
    expect(
      isHighlightActive({ is_highlight: true, highlight_active: true, highlight_until: future }, now),
    ).toBe(true);
  });

  it("ativa automaticamente evento com flyer durante a promoção de lançamento", () => {
    const event = { is_highlight: false, highlight_hidden: true, image_url: " https://cdn/flyer.webp " };
    expect(isLaunchPromotionalHighlight(event)).toBe(true);
    expect(isHighlightActive(event, now)).toBe(true);
    expect(highlightStatus(event, now)).toBe("ativo");
  });

  it("não promove automaticamente evento sem flyer", () => {
    expect(isLaunchPromotionalHighlight({ image_url: "  " })).toBe(false);
    expect(isHighlightActive({ is_highlight: false, image_url: null }, now)).toBe(false);
  });
});

describe("highlightDaysLeft", () => {
  it("conta os dias restantes", () => {
    expect(highlightDaysLeft({ highlight_until: future }, now)).toBe(7);
  });
  it("retorna 0 quando expirou", () => {
    expect(highlightDaysLeft({ highlight_until: past }, now)).toBe(0);
  });
  it("retorna null sem prazo", () => {
    expect(highlightDaysLeft({ highlight_until: null }, now)).toBeNull();
  });
});

describe("pickCarouselEvents", () => {
  it("coloca destaques ativos na frente e ordena o resto por data", () => {
    const events = [
      { id: "a", date: "2026-09-20" },
      { id: "b", date: "2026-09-30", is_highlight: true, highlight_until: future },
      { id: "c", date: "2026-09-10" },
      { id: "d", date: "2026-09-11", is_highlight: true, highlight_until: past },
      { id: "e", date: "2026-09-12", is_highlight: true, highlight_hidden: true },
    ];
    expect(pickCarouselEvents(events, 10, now).map((e) => e.id)).toEqual([
      "b",
      "c",
      "d",
      "e",
      "a",
    ]);
  });

  it("limita em 10 itens", () => {
    const events = Array.from({ length: 25 }, (_, i) => ({
      id: String(i),
      date: `2026-09-${String((i % 28) + 1).padStart(2, "0")}`,
    }));
    expect(pickCarouselEvents(events, 10, now)).toHaveLength(10);
  });
});

describe("prioritizeHomeHeroEvents", () => {
  it("mantém o destaque ativo antes dos demais itens do banner", () => {
    const events = [
      { id: "comum", is_highlight: false },
      { id: "destaque", is_highlight: true },
      { id: "outro", is_highlight: false },
    ];

    expect(prioritizeHomeHeroEvents(events, (id) => id.length).map((event) => event.id)).toEqual([
      "destaque",
      "comum",
      "outro",
    ]);
  });

  it("coloca eventos com flyer antes dos demais sem ativação manual", () => {
    const events = [
      { id: "manual", is_highlight: true },
      { id: "flyer", is_highlight: false, image_url: "https://cdn/flyer.webp" },
      { id: "comum", is_highlight: false },
    ];

    expect(prioritizeHomeHeroEvents(events, (id) => ({ flyer: 1, manual: 2, comum: 3 }[id] ?? 9)).map((event) => event.id)).toEqual([
      "flyer",
      "manual",
      "comum",
    ]);
  });
});
