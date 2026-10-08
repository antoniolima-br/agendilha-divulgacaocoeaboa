import { describe, expect, it } from "vitest";
import { REGIONS, REGION_NEIGHBORHOODS, regionOf, activeRegions } from "./regions";
describe("Rio macro-regions", () => {
  it("has eight regions without duplicate neighborhoods", () => {
    expect(REGIONS).toHaveLength(8);
    const neighborhoods = REGIONS.flatMap((r) => REGION_NEIGHBORHOODS[r]);
    expect(new Set(neighborhoods).size).toBe(neighborhoods.length);
  });
  it.each([["Paquetá", "Centro"], ["Copacabana", "Zona Sul"], ["TIJUCA", "Grande Tijuca"], ["Meier", "Zona Norte"], ["Tauá", "Ilha do Governador"], ["Taquara", "Jacarepaguá"], ["Recreio", "Barra e Recreio"], ["Bangu", "Zona Oeste"]])("maps %s to %s", (neighborhood, region) => expect(regionOf({ address_neighborhood: neighborhood })).toBe(region));
  it("disambiguates Freguesia while preserving legacy values", () => {
    expect(regionOf({ address_neighborhood: "Freguesia" })).toBe("Ilha do Governador");
    expect(regionOf({ address_neighborhood: "Freguesia (Jacarepaguá)" })).toBe("Jacarepaguá");
    expect(regionOf({ address_neighborhood: "Freguesia de Jacarepaguá" })).toBe("Jacarepaguá");
  });
  it("does not classify other cities or unknown neighborhoods", () => {
    expect(regionOf({ address_neighborhood: "Olaria" })).toBe("Zona Norte");
    expect(regionOf({ address_neighborhood: " olaria ", address_city: "Rio de Janeiro" })).toBe("Zona Norte");
    expect(regionOf({ address_neighborhood: "Centro", address_city: "Niterói" })).toBeNull();
    expect(regionOf({ address_neighborhood: "Desconhecido" })).toBeNull();
  });
  it("orders active regions", () => expect(activeRegions([{ address_neighborhood: "Bangu" }, { address_neighborhood: "Lapa" }])).toEqual(["Centro", "Zona Oeste"]));
});