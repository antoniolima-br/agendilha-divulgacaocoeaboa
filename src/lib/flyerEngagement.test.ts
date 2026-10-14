import { describe, expect, it } from "vitest";
import { flyerEngagementRange } from "./flyerEngagement";

describe("flyer engagement periods", () => {
  const now = new Date("2026-10-14T19:55:00Z");
  it("treats today as the complete São Paulo calendar day", () => {
    expect(flyerEngagementRange("today", now)).toEqual({ startAt: "2026-10-14T00:00:00-03:00", endAt: "2026-10-15T00:00:00-03:00" });
  });
  it("includes today in the last seven days", () => {
    expect(flyerEngagementRange("7days", now)).toEqual({ startAt: "2026-10-08T00:00:00-03:00", endAt: "2026-10-15T00:00:00-03:00" });
  });
  it("uses both custom dates inclusively", () => {
    expect(flyerEngagementRange("custom", now, "2026-09-03", "2026-09-09")).toEqual({ startAt: "2026-09-03T00:00:00-03:00", endAt: "2026-09-10T00:00:00-03:00" });
  });
});