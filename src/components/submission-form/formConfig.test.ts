import { describe, expect, it } from "vitest";
import { cleanOptional, fieldsForSubmissionStep, resolveAtrativoCategory, toEventDateOnly, suggestedSubmissionDate } from "./formConfig";

describe("submission form configuration", () => {
  it("keeps each step's validation fields stable", () => {
    expect(fieldsForSubmissionStep(1)).toEqual(["date", "startTime", "atrativoName", "additionalEvents"]);
    expect(fieldsForSubmissionStep(2)).toEqual(["legalAcceptance"]);
    expect(fieldsForSubmissionStep(3)).toEqual([]);
  });

  it("normalizes optional values without inventing content", () => {
    expect(cleanOptional("  Local  ")).toBe("Local");
    expect(cleanOptional("Não informado")).toBeNull();
    expect(cleanOptional(" ")).toBeNull();
  });

  it("keeps custom categories and São Paulo calendar days", () => {
    expect(resolveAtrativoCategory({ atrativoCategory: "Outros", atrativoCategoryOther: "Circo" })).toBe("Circo");
    expect(toEventDateOnly("2026-10-14")).toBe("2026-10-14");
  });
});
describe("manual submission date suggestion", () => {
  it("suggests today in São Paulo, including before the UTC day changes locally", () => {
    expect(suggestedSubmissionDate("", new Date("2026-10-16T01:00:00Z"))).toBe("2026-10-15");
  });
  it("preserves the date selected by the organizer", () => {
    expect(suggestedSubmissionDate("2026-10-24", new Date("2026-10-15T20:24:00Z"))).toBe("2026-10-24");
  });
});
