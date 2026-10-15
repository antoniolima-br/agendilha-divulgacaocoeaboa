import { describe, expect, it } from "vitest";
import { parseFlyerText } from "./flyerText";
const now = new Date("2026-10-15T17:58:00Z");
describe("OCR text suggestions", () => {
  it("recognizes DD/MM and 22h and labeled venue/title", () => {
    expect(parseFlyerText("Evento: Samba da Ilha\n25/10\n22h\nLocal: Bar da Praça", now)).toEqual({ eventTitle: "Samba da Ilha", date: "2026-10-25", startTime: "22:00", locationName: "Bar da Praça" });
  });
  it("recognizes 20:00", () => expect(parseFlyerText("20:00", now)).toEqual({ startTime: "20:00" }));
  it("suggests the next weekday using São Paulo day", () => expect(parseFlyerText("Sábado\n20h", now)).toEqual({ date: "2026-10-17", startTime: "20:00" }));
  it("uses the next occurrence for dates without year", () => expect(parseFlyerText("10/10", now).date).toBe("2027-10-10"));
  it("respects an explicit historical year", () => expect(parseFlyerText("10/10/2025", now).date).toBe("2025-10-10"));
  it("leaves ambiguous dates and times manual", () => {
    const fields = parseFlyerText("25/10 e 26/10\n20h e 22h", now);
    expect(fields.date).toBeUndefined(); expect(fields.startTime).toBeUndefined();
  });
  it("rejects invalid dates and times", () => {
    const fields = parseFlyerText("31/02/2026\n25:70", now);
    expect(fields.date).toBeUndefined(); expect(fields.startTime).toBeUndefined();
  });
  it("returns no fields for illegible text", () => expect(parseFlyerText("@#$\n", now)).toEqual({}));
});
