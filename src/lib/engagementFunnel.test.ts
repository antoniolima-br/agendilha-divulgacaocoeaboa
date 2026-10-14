import { describe, expect, it } from "vitest";
import { engagementRange, normalizeEngagementOrigin } from "./engagementFunnel";

describe("engagement funnel", () => {
  it("uses São Paulo calendar days for the selected period", () => {
    expect(engagementRange(7, new Date("2026-10-14T20:00:00Z"))).toEqual({
      startAt: "2026-10-08T00:00:00-03:00",
      endAt: "2026-10-15T00:00:00-03:00",
    });
  });

  it("keeps only known acquisition origins", () => {
    expect(normalizeEngagementOrigin("whatsapp")).toBe("whatsapp");
    expect(normalizeEngagementOrigin("unexpected")).toBe("direct");
    expect(normalizeEngagementOrigin(null)).toBe("direct");
  });
});