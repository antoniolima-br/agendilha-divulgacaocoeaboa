import { describe, expect, it } from "vitest";
import {
  eventDateISO,
  isPublicEventStatus,
  isValidEventDate,
  saoPauloTodayISO,
} from "@/lib/eventDate";

describe("eventDate", () => {
  it("calcula o dia atual pelo fuso de São Paulo", () => {
    expect(saoPauloTodayISO(new Date("2026-09-23T01:30:00.000Z"))).toBe("2026-09-22");
    expect(saoPauloTodayISO(new Date("2026-09-23T03:30:00.000Z"))).toBe("2026-09-23");
  });

  it("normaliza datas simples, brasileiras e timestamps para São Paulo", () => {
    expect(eventDateISO("2026-09-25")).toBe("2026-09-25");
    expect(eventDateISO("25/09/2026")).toBe("2026-09-25");
    expect(eventDateISO("2026-09-25T02:30:00.000Z")).toBe("2026-09-24");
  });

  it("rejeita datas ausentes, inválidas ou impossíveis", () => {
    expect(eventDateISO(null)).toBe("");
    expect(eventDateISO("sem-data")).toBe("");
    expect(eventDateISO("2026-02-30")).toBe("");
    expect(isValidEventDate("31/02/2026")).toBe(false);
  });

  it.each(["aprovado", "publicado", "divulgado"])("aceita o status público %s", (status) => {
    expect(isPublicEventStatus(status)).toBe(true);
  });

  it.each(["pendente", "rascunho", "rejeitado", null])("rejeita o status não público %s", (status) => {
    expect(isPublicEventStatus(status)).toBe(false);
  });
});