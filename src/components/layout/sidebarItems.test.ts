import { describe, expect, it } from "vitest";
import { sidebarConfig, filterSidebarSections } from "./sidebarItems";
import { ROUTES, routeExists } from "@/routes/config";
import { ROUTE_PERMISSIONS } from "@/routes/access";
import { computePermissions } from "@/hooks/useAppPermissions";

describe("sidebarConfig", () => {
  it("compartilhamento pessoal segue o acesso do painel do divulgador", () => {
    const items = sidebarConfig.find(s => s.id === "divulgacao")?.items ?? [];
    const index = items.findIndex(i => i.id === "my_submissions");
    expect(items[index + 1]?.path).toBe(ROUTES.COMPARTILHAR_MEUS_EVENTOS);
    expect(items[index + 1]?.roles).toEqual(items[index]?.roles);
    expect(items[index + 1]?.roles).not.toContain("public_registered");
    expect(routeExists(ROUTES.COMPARTILHAR_MEUS_EVENTOS)).toBe(true);
  });
  it.each(["public_guest", "public_registered", "promoter", "collaborator", "admin", "financeiro", "senior", "master"] as const)("restringe link comercial para %s", (role) => {
    const { permissions } = computePermissions({ roleNames: [role], collaborator: null, profileRole: null });
    const visible = filterSidebarSections(role, (p) => permissions.has(p), routeExists);
    expect(visible.some((s) => s.items.some((i) => i.path === ROUTES.ADMIN_PITCH_COMERCIAL))).toBe(["admin", "financeiro", "senior", "master"].includes(role));
    expect(ROUTE_PERMISSIONS[ROUTES.ADMIN_PITCH_COMERCIAL]).toBe("pitch.read");
  });
  it("admin tem Meus eventos separado da Curadoria e do Financeiro", () => {
    const personal = sidebarConfig.find((section) => section.id === "divulgacao");
    expect(personal?.items.find((item) => item.id === "my_submissions")?.roles).toContain("admin");
    expect(personal?.items.find((item) => item.id === "send_event")?.roles).toContain("admin");
    expect(personal?.items.some((item) => item.path.startsWith("/admin"))).toBe(false);
    expect(sidebarConfig.find((section) => section.id === "operacao")?.items.find((item) => item.id === "financeiro")?.roles).toContain("admin");
  });
  it("centraliza as ferramentas de WhatsApp no Relatório Diário", () => {
    const operation = sidebarConfig.find((section) => section.id === "operacao");
    const central = operation?.items.find((item) => item.id === "relatorio_diario");

    expect(central?.label).toBe("Relatório Diário (Coé a Boa?)");
    expect(central?.children?.map((item) => item.id)).toEqual([
      "agenda_informa",
      "carrossel",
      "whatsapp_templates",
    ]);
    expect(central?.children?.some((item) => item.id === "compartilhar_agenda_informa")).toBe(false);
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
      "negocios_explorar",
    ]);
    expect(adminRegistrations?.children?.map((item) => item.id)).toEqual([
      "atrativos_admin",
      "estabelecimentos_admin",
      "negocios_admin",
    ]);
    expect(adminRegistrations?.label).toBe("Gerenciamento de Cadastros");
    expect(adminRegistrations?.children?.map((item) => item.label)).toEqual([
      "Gerenciar Atrativos",
      "Gerenciar Locais de Rolê",
      "Gerenciar Negócios Gerais",
    ]);
    expect(explore?.items.some((item) => ["artists", "estabelecimentos_explorar"].includes(item.id))).toBe(false);
    expect(operation?.items.some((item) => ["atrativos_admin", "estabelecimentos_admin"].includes(item.id))).toBe(false);
  });

  it("agrupa a gestão de eventos e flyers em Moderação", () => {
    const operation = sidebarConfig.find((section) => section.id === "operacao");
    const moderation = operation?.items.find((item) => item.id === "moderacao");

    expect(moderation?.children?.map((item) => item.id)).toEqual([
      "manage_events",
      "curadoria",
      "published_events",
      "flyer_moderator",
    ]);
    expect(operation?.items.some((item) => ["manage_events", "flyer_moderator"].includes(item.id))).toBe(false);
  });
});