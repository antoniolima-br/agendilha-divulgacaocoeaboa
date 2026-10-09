import { describe, expect, it } from "vitest";
import { canonicalAdRegions, matchesAdAudience, safeAdDestination } from "./advertising";

describe("advertiser destinations", () => {
  it.each(["https://example.com/oferta", "https://instagram.com/parceiro", "https://wa.me/5521998554322"])("accepts %s", (url) => expect(safeAdDestination(url)).toBe(url));
  it.each(["javascript:alert(1)", "data:text/html,hi", "//example.com", "https://user:password@example.com", "https://example.com/a b", "invalid", ""])("rejects %s", (url) => expect(safeAdDestination(url)).toBeNull());
});
describe("campaign audience", () => {
  const ad = { product_id: "product", target_regions: ["Zona Norte"], product_active: true, placement: "carousel" as const };
  it("matches case and accents and respects placement", () => {
    expect(matchesAdAudience(ad, "ZONA NORTE", "carousel")).toBe(true);
    expect(matchesAdAudience(ad, "Zona Sul", "carousel")).toBe(false);
    expect(matchesAdAudience(ad, "all", "carousel")).toBe(false);
    expect(matchesAdAudience(ad, "Zona Norte", "agenda_card")).toBe(false);
  });
  it("hides inactive and unknown-region campaigns", () => {
    expect(matchesAdAudience({ ...ad, product_active: false }, "Zona Norte")).toBe(false);
    expect(matchesAdAudience(ad, "Desconhecido")).toBe(false);
  });
  it("keeps legacy banners within their neighborhood region", () => {
    const legacy = { ...ad, product_id: null, neighborhood: "Olaria", city: "Rio de Janeiro" };
    expect(matchesAdAudience(legacy, "Zona Norte", "carousel")).toBe(true);
    expect(matchesAdAudience(legacy, "Zona Sul", "carousel")).toBe(false);
    expect(matchesAdAudience(legacy, "all", "carousel")).toBe(false);
  });
  it("normalizes only official regions", () => expect(canonicalAdRegions(["jacarepagua", "ZONA NORTE", "Zona Norte", "fake"])).toEqual(["Zona Norte", "Jacarepaguá"]));
});