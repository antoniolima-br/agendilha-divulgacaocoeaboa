import { describe, expect, it } from "vitest";
import { matchesTimePreferences, timePeriodOf } from "./timePreferences";

describe("faixas de horário do Radar", () => {
  it("classifica o horário de início", () => {
    expect(timePeriodOf("09:00")).toBe("manha");
    expect(timePeriodOf("12:00")).toBe("tarde");
    expect(timePeriodOf("18:00")).toBe("noite");
    expect(timePeriodOf("02:30")).toBe("madrugada");
  });
  it("filtra só pelas faixas escolhidas", () => {
    expect(matchesTimePreferences("21:00", ["noite"])).toBe(true);
    expect(matchesTimePreferences("10:00", ["noite"])).toBe(false);
  });
  it("sem faixa escolhida, vale qualquer hora", () => {
    expect(matchesTimePreferences("10:00", [])).toBe(true);
  });
  it("rolê sem horário informado continua aparecendo", () => {
    expect(matchesTimePreferences(null, ["noite"])).toBe(true);
  });
});
