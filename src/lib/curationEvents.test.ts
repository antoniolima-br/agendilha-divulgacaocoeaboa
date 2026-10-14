import { describe, expect, it } from "vitest";
import { curationEventInvite, curationEventLink, emptyCurationEventForm, validateCurationEventForm } from "./curationEvents";

describe("curationEvents", () => {
  it("exige nome, data e horário no cadastro rápido", () => {
    expect(validateCurationEventForm(emptyCurationEventForm())).toBe("Informe nome, data e horário do rolê.");
  });

  it("aceita apenas links https para inscrição e flyer", () => {
    const form = { ...emptyCurationEventForm(), title: "Samba", date: "2026-10-20", startTime: "20:00", registrationUrl: "http://exemplo.com" };
    expect(validateCurationEventForm(form)).toBe("O link de inscrição precisa começar com https://");
  });

  it("gera link compacto e convite de WhatsApp com os dados do rolê", () => {
    const event = { id: "abc", slug: "samba-na-praca", event_title: "Samba na Praça", date: "2026-10-20", start_time: "20:00" };
    const link = curationEventLink(event, "https://coeaboa.online");
    expect(link).toBe("https://coeaboa.online/evento/samba-na-praca");
    expect(curationEventInvite(event, link)).toContain("Samba na Praça\n📅 20/10/2026 às 20:00");
    expect(curationEventInvite(event, link)).toContain(link);
  });
});