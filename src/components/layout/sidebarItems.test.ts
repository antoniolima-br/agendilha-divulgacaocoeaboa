import { describe, expect, it } from "vitest";
import { sidebarConfig, filterSidebarSections, isSidebarItemActive } from "./sidebarItems";
import { ROUTES, routeExists } from "@/routes/config";
import { ROUTE_PERMISSIONS } from "@/routes/access";
import { computePermissions } from "@/hooks/useAppPermissions";

describe("sidebarConfig", () => {
  it("indica somente a página pessoal selecionada", () => {
    const items = sidebarConfig.find(s => s.id === "divulgacao")?.items ?? [];
    expect(items.filter(item => isSidebarItemActive(item, ROUTES.COMPARTILHAR_MEUS_EVENTOS, ROUTES.COMPARTILHAR_MEUS_EVENTOS)).map(item => item.id)).toEqual(["share_my_events"]);
  });
  it("não confunde prefixos de irmãos ou links com consulta", () => {
    const items = sidebarConfig.find(s => s.id === "explorar")?.items ?? [];
    const item = items[0];
    if (!item) throw new Error("missing explore link");
    expect(isSidebarItemActive(item, `${item.path}-extra`, `${item.path}-extra`)).toBe(false);
    const favorite = items.find(i => i.id === "favorites");
    if (!favorite) throw new Error("missing favorites link");
    expect(isSidebarItemActive(favorite, ROUTES.AGENDA, `${ROUTES.AGENDA}?view=favorites`)).toBe(true);
    expect(isSidebarItemActive(favorite, ROUTES.AGENDA, ROUTES.AGENDA)).toBe(false);
  });
  it("compartilhamento pessoal segue o acesso do painel do divulgador", () => {
    const items = sidebarConfig.find(s => s.id === "divulgacao")?.items ?? [];
    const index = items.findIndex(i => i.id === "my_submissions");
    expect(items[index + 1]?.path).toBe(ROUTES.COMPARTILHAR_MEUS_EVENTOS);
    expect(items[index + 1]?.roles).toEqual(items[index]?.roles);
    expect(items[index + 1]?.roles).not.toContain("public_registered");
    expect(routeExists(ROUTES.COMPARTILHAR_MEUS_EVENTOS)).toBe(true);
    expect(filterSidebarSections("collaborator", () => false, routeExists).flatMap(s => s.items).some(i => i.id === "share_my_events")).toBe(false);
  });
  it.each(["public_guest", "public_registered", "promoter", "collaborator", "admin", "financeiro", "senior", "master"] as const)("restringe link comercial para %s", (role) => {
    const { permissions } = computePermissions({ roleNames: [role], collaborator: null, profileRole: null });
    const visible = filterSidebarSections(role, (p) => permissions.has(p), routeExists);
    expect(visible.some((s) => s.items.some((i) => i.path === ROUTES.ADMIN_PITCH_COMERCIAL))).toBe(["admin", "financeiro", "senior", "master"].includes(role));
    expect(ROUTE_PERMISSIONS[ROUTES.ADMIN_PITCH_COMERCIAL]).toBe("pitch.read");
  });
  it("admin tem Meus eventos separado da Curadoria e Financeiro dentro de Gestão setorial", () => {
    const personal = sidebarConfig.find((section) => section.id === "divulgacao");
    expect(personal?.items.find((item) => item.id === "my_submissions")?.roles).toContain("admin");
    expect(personal?.items.find((item) => item.id === "send_event")?.roles).toContain("admin");
    expect(personal?.items.some((item) => item.path.startsWith("/admin"))).toBe(false);
    expect(sidebarConfig.find((section) => section.id === "intranet")?.items.find((item) => item.id === "intranet_portal")?.children?.find((item) => item.id === "financeiro")?.roles).toContain("admin");
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

  it("unifica usuários e cadastros em Governança", () => {
    const explore = sidebarConfig.find((section) => section.id === "explorar");
    const governance = sidebarConfig.find((section) => section.id === "governanca");
    const exploreRegistrations = explore?.items.find((item) => item.id === "cadastros_explorar");
    const adminRegistrations = governance?.items.find((item) => item.id === "governance_records");

    expect(exploreRegistrations?.children?.map((item) => item.id)).toEqual([
      "artists",
      "estabelecimentos_explorar",
      "negocios_explorar",
    ]);
    expect(adminRegistrations?.children?.map((item) => item.id)).toEqual([
      "divulgadores_admin",
      "atrativos_admin",
      "estabelecimentos_admin",
      "negocios_admin",
    ]);
    expect(adminRegistrations?.label).toBe("Administração e cadastros");
    expect(adminRegistrations?.children?.map((item) => item.label)).toEqual([
      "Gerenciar usuários",
      "Gerenciar atrativos",
      "Gerenciar locais de rolê",
      "Gerenciar negócios gerais",
    ]);
    expect(explore?.items.some((item) => ["artists", "estabelecimentos_explorar"].includes(item.id))).toBe(false);
    expect(governance?.items.some((item) => ["atrativos_admin", "estabelecimentos_admin", "manage_users"].includes(item.id))).toBe(false);
  });

  it("unifica Central da Home e Moderação em uma única entrada", () => {
    const operation = sidebarConfig.find((section) => section.id === "operacao");
    expect(operation?.items.find((item) => item.id === "central_moderacao")?.label).toBe("Curadoria e Moderação");
    expect(operation?.items.filter((item) => ["central_home", "moderacao"].includes(item.id))).toHaveLength(0);
  });

  it("mostra a jornada essencial de cada perfil sem atalhos redundantes", () => {
    const publicItems = filterSidebarSections("public_guest", () => true, routeExists).flatMap((section) => section.items);
    expect(publicItems.map((item) => item.id)).toEqual(["agenda", "divulgador_status"]);
    const promoterItems = filterSidebarSections("promoter", () => true, routeExists).flatMap((section) => section.items);
    expect(promoterItems.find((item) => item.id === "send_event")?.label).toBe("Publicar Evento");
    expect(promoterItems.some((item) => item.id === "ad_plans_catalog")).toBe(true);
    expect(sidebarConfig.flatMap((section) => section.items).some((item) => ["seu_radar", "divulgar_contratar"].includes(item.id))).toBe(false);
  });
});