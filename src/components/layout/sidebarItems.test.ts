import { describe, expect, it } from "vitest";
import { sidebarConfig } from "./sidebarItems";

describe("sidebarConfig", () => {
  it("centraliza as ferramentas de WhatsApp em um único item da operação", () => {
    const operation = sidebarConfig.find((section) => section.id === "operacao");
    const central = operation?.items.find((item) => item.id === "relatorio_diario");

    expect(central?.label).toBe("Central de Relatórios / WhatsApp");
    expect(central?.children?.map((item) => item.id)).toEqual([
      "agenda_informa",
      "compartilhar_agenda_informa",
      "carrossel",
      "whatsapp_templates",
    ]);
    expect(operation?.items.some((item) => item.id === "carrossel")).toBe(false);
    expect(operation?.items.some((item) => item.id === "whatsapp_templates")).toBe(false);
  });
});