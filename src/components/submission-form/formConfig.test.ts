import { describe, expect, it } from "vitest";
import { cleanOptional, fieldsForSubmissionStep, resolveAtrativoCategory, toEventDateOnly } from "./formConfig";

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