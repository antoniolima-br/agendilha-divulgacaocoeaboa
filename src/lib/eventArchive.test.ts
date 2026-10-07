import { describe, expect, it } from "vitest";
import { isArchivedEvent, repeatEventDraft } from "./eventArchive";

describe("private event archive", () => {
  const now = new Date("2026-10-07T15:00:00Z");
  it("archives yesterday, but retains today and future dates", () => {
    expect(isArchivedEvent("2026-10-06", now)).toBe(true);
    expect(isArchivedEvent("2026-10-07", now)).toBe(false);
    expect(isArchivedEvent("2026-10-08", now)).toBe(false);
  });
  it("handles legacy timestamps and São Paulo midnight", () => {
    expect(isArchivedEvent("2026-10-07T01:00:00Z", now)).toBe(true);
    expect(isArchivedEvent("06/10/2026", now)).toBe(true);
    expect(isArchivedEvent(null, now)).toBe(false);
    expect(isArchivedEvent("invalid", now)).toBe(false);
  });
  it("copies only content and requires a fresh schedule, consent and approval", () => {
    const draft = repeatEventDraft({ id: "old", user_id: "other", event_title: "Show", date: "2026-01-01", start_time: "20:00", status: "aprovado", is_highlight: true, legal_acceptance: true, image_url: "https://example.com/old.jpg", location: "Local", atrativo_name: "Banda" });
    expect(draft).toMatchObject({ eventTitle: "Show", locationName: "Local", atrativoName: "Banda", date: "", startTime: "", endTime: "", legalAcceptance: false, promotionChoice: "free", eventImageUrl: "", additionalEvents: [] });
    expect(draft).not.toHaveProperty("id");
    expect(draft).not.toHaveProperty("user_id");
    expect(draft).not.toHaveProperty("status");
    expect(draft).not.toHaveProperty("is_highlight");
  });
});