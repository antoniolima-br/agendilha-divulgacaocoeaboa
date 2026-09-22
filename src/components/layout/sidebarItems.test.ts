import { describe, expect, it } from "vitest";
import { sidebarConfig } from "./sidebarItems";

describe("sidebarConfig", () => {
  it("centraliza as ferramentas de WhatsApp no Relatório Diário", () => {
    const operation = sidebarConfig.find((section) => section.id === "operacao");
    const central = operation?.items.find((item) => item.id === "relatorio_diario");

    expect(central?.label).toBe("Relatório Diário (Coé a Boa?)");
    expect(central?.children?.map((item) => item.id)).toEqual([
      "agenda_informa",
      "compartilhar_agenda_informa",
      "carrossel",
      "whatsapp_templates",
    ]);
    expect(operation?.items.some((item) => item.id === "carrossel")).toBe(false);
    expect(operation?.items.some((item) => item.id === "whatsapp_templates")).toBe(false);
  });

  it("mantém Operação e Governança exclusivas de administradores", () => {
    for (const sectionId of ["operacao", "governanca"]) {
      const section = sidebarConfig.find((candidate) => candidate.id === sectionId);
      expect(section?.roles).toEqual(expect.arrayContaining(["admin", "master"]));
      expect(section?.roles).not.toContain("public_guest");
      expect(section?.roles).not.toContain("public_registered");
      expect(section?.roles).not.toContain("promoter");
    }
  });

  it("agrupa atrativos e estabelecimentos em Cadastros", () => {
    const explore = sidebarConfig.find((section) => section.id === "explorar");
    const operation = sidebarConfig.find((section) => section.id === "operacao");
    const exploreRegistrations = explore?.items.find((item) => item.id === "cadastros_explorar");
    const adminRegistrations = operation?.items.find((item) => item.id === "cadastros_admin");

    expect(exploreRegistrations?.children?.map((item) => item.id)).toEqual([
      "artists",
      "estabelecimentos_explorar",
    ]);
    expect(adminRegistrations?.children?.map((item) => item.id)).toEqual([
      "atrativos_admin",
      "estabelecimentos_admin",
    ]);
    expect(adminRegistrations?.label).toBe("Gerenciamento de Cadastros");
    expect(adminRegistrations?.children?.map((item) => item.label)).toEqual([
      "Gerenciar Atrativos",
      "Gerenciar Estabelecimentos",
    ]);
    expect(explore?.items.some((item) => ["artists", "estabelecimentos_explorar"].includes(item.id))).toBe(false);
    expect(operation?.items.some((item) => ["atrativos_admin", "estabelecimentos_admin"].includes(item.id))).toBe(false);
  });

  it("agrupa a gestão de eventos e flyers em Moderação", () => {
    const operation = sidebarConfig.find((section) => section.id === "operacao");
    const moderation = operation?.items.find((item) => item.id === "moderacao");

    expect(moderation?.children?.map((item) => item.id)).toEqual([
      "manage_events",
      "flyer_moderator",
    ]);
    expect(operation?.items.some((item) => ["manage_events", "flyer_moderator"].includes(item.id))).toBe(false);
  });
});