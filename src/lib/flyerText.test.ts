import { describe, expect, it } from "vitest";
import { parseFlyerText } from "./flyerText";
const now = new Date("2026-10-15T17:58:00Z");
describe("OCR text suggestions", () => {
  it.each(["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"])("recognizes a date written with %s", month => {
    const index = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"].indexOf(month) + 1;
    expect(parseFlyerText(`25 de ${month} de 2027`, now)).toEqual({ date: `2027-${String(index).padStart(2, "0")}-25` });
  });
  it("distributes noisy OCR with a written date and keyword hour", () => {
    expect(parseFlyerText("APRESENTA\nSAMBA DA ILHA\nSÁBADO, 24 DE OUTUBRO\nàs 20\nLocal do evento: Bar da Praça\nIngressos R$ 30", now)).toEqual({ eventTitle: "SAMBA DA ILHA", date: "2026-10-24", startTime: "20:00", locationName: "Bar da Praça" });
  });
  it("recognizes compact written dates and spaced hours", () => {
    expect(parseFlyerText("Evento: Noite Musical\n25 outubro 2026\nÀS 20 h 30\nOnde - Teatro da Ilha", now)).toEqual({ eventTitle: "Noite Musical", date: "2026-10-25", startTime: "20:30", locationName: "Teatro da Ilha" });
  });
  it("leaves month-only and contradictory dates manual without losing safe content", () => {
    expect(parseFlyerText("FESTA DA ILHA\nSexta de novembro\nàs 21\nLocal Bar da Praça", now)).toEqual({ eventTitle: "FESTA DA ILHA", startTime: "21:00", locationName: "Bar da Praça" });
    expect(parseFlyerText("25/10\n26 de outubro\n20h", now).date).toBeUndefined();
  });
  it("does not interpret invalid hour fragments or prices as valid times", () => {
    expect(parseFlyerText("Às 25h\nÀs 20:70\nIngresso 20 reais", now).startTime).toBeUndefined();
  });
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
