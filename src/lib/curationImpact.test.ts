import { describe, expect, it } from "vitest";
import { curationImpactRange, normalizeCurationChannel } from "./curationImpact";

describe("curation impact", () => {
  it("uses São Paulo calendar days", () => {
    expect(curationImpactRange(7, new Date("2026-10-14T20:00:00Z"))).toEqual({
      startAt: "2026-10-08T00:00:00-03:00",
      endAt: "2026-10-15T00:00:00-03:00",
    });
  });

  it("accepts only Curadoria tracking channels", () => {
    expect(normalizeCurationChannel("curation_qr")).toBe("curation_qr");
    expect(normalizeCurationChannel("unknown")).toBeUndefined();
    expect(normalizeCurationChannel(null)).toBeUndefined();
  });
});