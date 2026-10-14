import { describe, expect, it } from "vitest";
import { confirmedGuideAnswer, guideIntent } from "../../supabase/functions/coezinho/confirmedAnswers";
import type { GuideEvent } from "../../supabase/functions/coezinho/agenda";

const event = (date: string, id: string): GuideEvent => ({ id, slug: id, date, event_title: id, start_time: "20:00", end_time: null, location: "Local cadastrado", address_street: null, address_number: null, address_neighborhood: null, address_city: null, address_state: null, address_zip: null, latitude: null, longitude: null, category: null, description: null, is_highlight: false });
describe("confirmed guide data", () => {
  it("today includes today's events only, with their real detail destinations", () => {
    const reply = confirmedGuideAnswer("today", [event("2026-10-14", "real-today"), event("2026-10-15", "future")], [], "2026-10-14", { name: "", phone: "" });
    expect(reply).toContain("/evento/real-today");
    expect(reply).not.toContain("future");
  });
  it("uses the configured contact without inventing one when absent", () => {
    expect(confirmedGuideAnswer("commercial", [], [], "2026-10-14", { name: "Equipe", phone: "21998554322" })).toContain("https://wa.me/5521998554322");
    expect(confirmedGuideAnswer("commercial", [], [], "2026-10-14", { name: "", phone: "" })).not.toContain("wa.me");
  });
  it("keeps specific event requests with the model rather than guessing results", () => {
    expect(guideIntent("Quais eventos estão rolando hoje?")).toBe("today");
    expect(guideIntent("Tem samba hoje em Copacabana?")).toBeNull();
    expect(guideIntent("Como cadastrar e divulgar meu evento?")).toBe("submission");
  });
});