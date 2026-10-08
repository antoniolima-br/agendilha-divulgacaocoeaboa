import { describe, expect, it } from "vitest";
import { REGIONS, REGION_NEIGHBORHOODS, regionOf, activeRegions, matchesEventGeography, matchesEventSearch } from "./regions";
describe("Rio macro-regions", () => {
  it.each(["Olaria", "Ramos", "Bonsucesso", "Penha", "Brás de Pina"])("matches %s regardless of case and accents", (bairro) => {
    const event = { address_neighborhood: ` ${bairro.toUpperCase()} ` };
    expect(regionOf(event)).toBe("Zona Norte");
    expect(matchesEventGeography(event, " zona  NORTE ", bairro.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase())).toBe(true);
    expect(matchesEventSearch(event, "ZONA NORTE")).toBe(true);
    expect(matchesEventSearch(event, bairro.toLowerCase())).toBe(true);
  });
  it("does not broaden geography to other neighborhoods or cities", () => {
    expect(matchesEventGeography({ address_neighborhood: "Penha Circular" }, "Zona Norte", "Penha")).toBe(false);
    expect(matchesEventGeography({ address_neighborhood: "Olaria", address_city: "Niterói" }, "Zona Norte")).toBe(false);
  });
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