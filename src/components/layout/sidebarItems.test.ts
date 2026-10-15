import { describe, expect, it } from "vitest";
import { sidebarConfig, filterSidebarSections, isSidebarItemActive } from "./sidebarItems";
import { ROUTES, routeExists } from "@/routes/config";
import { ROUTE_PERMISSIONS } from "@/routes/access";
import { computePermissions } from "@/hooks/useAppPermissions";

describe("sidebarConfig", () => {
  it("consolida a jornada em Meus eventos", () => {
    const items = sidebarConfig.find(s => s.id === "divulgacao")?.items ?? [];
    expect(items.map(item => item.id)).toEqual(["my_submissions"]);
    expect(items[0]?.path).toBe(ROUTES.MEUS_EVENTOS);
  });
  it("não confunde prefixos de irmãos", () => {
    const items = sidebarConfig.find(s => s.id === "explorar")?.items ?? [];
    const item = items[0];
    if (!item) throw new Error("missing explore link");
    expect(isSidebarItemActive(item, `${item.path}-extra`, `${item.path}-extra`)).toBe(false);
  });
  it("divulgador não vê atalhos gerenciais mesmo com permissões fornecidas", () => {
    const visible = filterSidebarSections("promoter", () => true, routeExists);
    expect(visible.map(section => section.id)).toEqual(["explorar", "divulgacao", "conta"]);
    expect(visible.flatMap(section => section.items).map(item => item.id)).toEqual(["agenda", "seu_radar", "my_submissions", "profile"]);
    expect(visible.flatMap(section => section.items).some(item => item.path.startsWith("/admin") || item.path.startsWith("/intranet"))).toBe(false);
  });
  it.each(["public_guest", "public_registered", "promoter", "collaborator", "admin", "financeiro", "senior", "master"] as const)("restringe link comercial para %s", (role) => {
    const { permissions } = computePermissions({ roleNames: [role], collaborator: null, profileRole: null });
    const visible = filterSidebarSections(role, (p) => permissions.has(p), routeExists);
    const paths = visible.flatMap((s) => s.items.map((i) => i.path));
    const allowed = ["admin", "financeiro", "senior", "master"].includes(role);
    expect(paths.includes(ROUTES.ADMIN_PITCH_SOCIOS)).toBe(allowed);
    expect(paths.includes(ROUTES.ADMIN_PITCH_ANUNCIANTES)).toBe(allowed);
    for (const path of [ROUTES.ADMIN_PITCH_COMERCIAL, ROUTES.ADMIN_PITCH_SOCIOS, ROUTES.ADMIN_PITCH_ANUNCIANTES]) expect(ROUTE_PERMISSIONS[path]).toBe("pitch.read");
  });
  it("mantém Meus eventos do admin separado e esconde a Gestão setorial", () => {
    const personal = sidebarConfig.find((section) => section.id === "divulgacao");
    expect(personal?.items.find((item) => item.id === "my_submissions")?.roles).toContain("admin");
    expect(personal?.items).toHaveLength(1);
    expect(personal?.items.some((item) => item.path.startsWith("/admin"))).toBe(false);
    const intranet = sidebarConfig.find((section) => section.id === "intranet");
    expect(intranet?.roles).toEqual(["master"]);
    expect(intranet?.items[0]?.roles).toEqual(["master"]);
    expect(filterSidebarSections("admin", () => true, routeExists).some((section) => section.id === "intranet")).toBe(false);
    expect(filterSidebarSections("master", () => true, routeExists).some((section) => section.id === "intranet")).toBe(true);
  });
  it("centraliza eventos e relatórios na Curadoria", () => {
    const curation = sidebarConfig.find((section) => section.id === "curadoria");
    const central = curation?.items.find((item) => item.id === "curadoria_moderacao");

    expect(central?.label).toBe("Curadoria e Moderação");
    expect(central?.children?.map((item) => item.id)).toEqual([
      "central_moderacao",
      "agenda_informa",
      "carrossel",
      "whatsapp_templates",
    ]);
    expect(central?.children?.some((item) => ["anuncios_admin", "planos_anuncio_admin", "destaques_admin"].includes(item.id))).toBe(false);
  });

  it("mantém os setores administrativos fora dos perfis públicos", () => {
    for (const sectionId of ["curadoria", "marketing", "comercial", "financeiro", "configuracoes"]) {
      const section = sidebarConfig.find((candidate) => candidate.id === sectionId);
      expect(section?.roles).toEqual(expect.arrayContaining(["admin", "master"]));
      expect(section?.roles).not.toContain("public_guest");
      expect(section?.roles).not.toContain("public_registered");
      expect(section?.roles).not.toContain("promoter");
    }
  });

  it("unifica usuários e cadastros em Configurações", () => {
    const explore = sidebarConfig.find((section) => section.id === "explorar");
    const governance = sidebarConfig.find((section) => section.id === "configuracoes");
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
    expect(adminRegistrations?.label).toBe("Usuários e cadastros");
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
    const curation = sidebarConfig.find((section) => section.id === "curadoria");
    expect(curation?.items.find((item) => item.id === "curadoria_moderacao")?.label).toBe("Curadoria e Moderação");
    expect(curation?.items.filter((item) => ["central_home", "moderacao"].includes(item.id))).toHaveLength(0);
  });

  it("separa Marketing, Comercial e Financeiro sem atalhos duplicados", () => {
    const marketing = sidebarConfig.find((section) => section.id === "marketing");
    const commercial = sidebarConfig.find((section) => section.id === "comercial");
    const finance = sidebarConfig.find((section) => section.id === "financeiro");
    expect(marketing?.items.map((item) => item.id)).toEqual(["marketing_setorial", "anuncios_admin", "destaques_admin"]);
    expect(commercial?.items.map((item) => item.id)).toEqual(["comercial_setorial", "planos_anuncio_admin", "pitch_socios", "pitch_anunciantes"]);
    expect(commercial?.items.slice(2).map((item) => item.label)).toEqual(["Pitch para Sócios", "Pitch para Anunciantes"]);
    expect(finance?.items.map((item) => item.id)).toEqual(["financeiro_admin", "pagamentos_destaque_admin"]);
    const ids = sidebarConfig.flatMap((section) => section.items.map((item) => item.id));
    expect(ids.filter((id) => id === "anuncios_admin")).toHaveLength(1);
    expect(ids.filter((id) => id === "planos_anuncio_admin")).toHaveLength(1);
    expect(ids.filter((id) => id === "pagamentos_destaque_admin")).toHaveLength(1);
  });

  it("mostra os cinco setores no menu do Master conforme as permissões protegidas", () => {
    const { permissions } = computePermissions({ roleNames: ["master"], collaborator: null, profileRole: null });
    const visible = filterSidebarSections("master", (permission) => permissions.has(permission), routeExists);
    expect(visible.map((section) => section.id)).toEqual(expect.arrayContaining([
      "curadoria",
      "marketing",
      "comercial",
      "financeiro",
      "configuracoes",
    ]));
  });

  it("mostra a jornada essencial de cada perfil sem atalhos redundantes", () => {
    const publicItems = filterSidebarSections("public_guest", () => true, routeExists).flatMap((section) => section.items);
    expect(publicItems.map((item) => item.id)).toEqual(["agenda", "seu_radar", "profile", "divulgador_status"]);
    const promoterItems = filterSidebarSections("promoter", () => true, routeExists).flatMap((section) => section.items);
    expect(promoterItems.some(item => item.id === "my_submissions")).toBe(true);
    expect(promoterItems.some(item => ["send_event", "ad_plans_catalog", "share_my_events"].includes(item.id))).toBe(false);
    expect(publicItems.find(item => item.id === "seu_radar")?.path).toBe(ROUTES.SEU_RADAR);
  });
});
