import { describe, it, expect } from "vitest";

const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

describe("Autocomplete accent-insensitive matching", () => {
  it("should match strings with different accents", () => {
    const s1 = "Conceição";
    const s2 = "conceicao";
    expect(normalize(s1)).toBe(normalize(s2));
  });

  it("should match strings with different case and whitespace", () => {
    const s1 = "  Praia da Bica  ";
    const s2 = "praia da bica";
    expect(normalize(s1)).toBe(normalize(s2));
  });
});
