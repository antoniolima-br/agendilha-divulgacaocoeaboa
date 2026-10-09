import { describe, it, expect } from "vitest";
import { buildPromoterEventShare, eligiblePromoterEvents, type PromoterShareEvent } from "./promoterEventSharing";
const event: PromoterShareEvent = { id: "event-1", user_id: "owner", slug: "samba-na-praca", event_title: "Samba na Praça", date: "2026-10-09", start_time: "19:00:00", location: "Praça Central", address_street: "Rua A", address_neighborhood: "Centro", description: "Samba ao vivo com convidados.", image_url: null, status: "aprovado" };
describe("compartilhamento do divulgador", () => {
  it("inclui somente eventos do dono", () => {
    expect(eligiblePromoterEvents([event, { ...event, id: "other", user_id: "another" }], "owner", "2026-10-09").map(e => e.id)).toEqual(["event-1"]);
    expect(eligiblePromoterEvents([event], undefined)).toEqual([]);
  });
  it("aceita aprovados e publicados, recusando pendentes e rejeitados", () => {
    const rows = ["aprovado", "publicado", "divulgado", "pendente", "rejeitado"].map(status => ({ ...event, id: status, status }));
    expect(eligiblePromoterEvents(rows, "owner", "2026-10-09").map(e => e.id)).toEqual(["aprovado", "publicado", "divulgado"]);
  });
  it("mantém hoje e futuros, sem compartilhar arquivados", () => {
    const rows = ["2026-10-08", "2026-10-09", "2026-10-10", null].map((date, i) => ({ ...event, date, id: String(i) }));
    expect(eligiblePromoterEvents(rows, "owner", "2026-10-09").map(e => e.id)).toEqual(["1", "2"]);
  });
  it("gera dados exclusivamente do evento e link direto", () => {
    const share = buildPromoterEventShare(event, "https://example.org");
    expect(share.url).toBe("https://example.org/evento/samba-na-praca");
    expect(share.text).toContain("09/10/2026 · 19:00");
    expect(share.text).toContain("Praça Central — Rua A — Centro");
    expect(share.text).toContain(event.description);
    expect(share.text.split(share.url).length).toBe(2);
  });
  it("resume descrições longas e permite títulos nulos", () => {
    const share = buildPromoterEventShare({ ...event, event_title: null, slug: null, description: "x".repeat(400) }, "https://example.org");
    expect(share.title).toBe("Praça Central");
    expect(share.text).toContain("x".repeat(277) + "…");
    expect(share.url).toBe("https://example.org/evento/event-1");
  });
});