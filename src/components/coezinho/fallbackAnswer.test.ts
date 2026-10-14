import { describe, expect, it } from "vitest";
import { coezinhoFallbackAnswer } from "./fallbackAnswer";

describe("Coezinho connection fallback", () => {
  it("covers today's agenda without inventing an event", () => {
    const answer = coezinhoFallbackAnswer("Quais os eventos de hoje?");
    expect(answer).toContain("programação atual");
    expect(answer).toContain("Agenda");
  });

  it("routes submissions and explains the app", () => {
    expect(coezinhoFallbackAnswer("Como divulgar?")).toContain("Cadastrar Evento");
    expect(coezinhoFallbackAnswer("Como funciona o app?")).toContain("Meu Radar");
  });
});