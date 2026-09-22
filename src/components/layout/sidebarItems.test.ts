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
});