import { describe, expect, it } from "vitest";
import { activePlaceLabel, activePlacePhrase, radarDefaultRegion } from "./activePlace";

describe("lugar ativo da Home", () => {
  it("sem escolha fala do Rio todo, nunca da Ilha fixa", () => {
    expect(activePlaceLabel("all", "all")).toBe("Rio");
    expect(activePlacePhrase("all", "all")).toBe("no Rio");
  });
  it("bairro escolhido vence a região", () => {
    expect(activePlaceLabel("Grande Tijuca", "Tijuca")).toBe("Tijuca");
  });
  it("usa a região seguida no Radar", () => {
    expect(radarDefaultRegion(["zona sul"])).toBe("Zona Sul");
    expect(radarDefaultRegion(["Marte"])).toBeNull();
  });
});
