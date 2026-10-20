import { describe, expect, it } from "vitest";
import { filterSidebarSections, governanceConfig } from "./sidebarItems";
import { routeExists } from "@/routes/config";

const roles = ["public_guest", "public_registered", "promoter", "collaborator", "admin", "financeiro", "senior", "master", "sector"] as const;

describe("menu lateral sem governança", () => {
  it.each(roles)("%s vê só Explorar, Área do Divulgador e Conta", (role) => {
    const ids = filterSidebarSections(role, () => true, routeExists).map((s) => s.id);
    expect(ids.every((id) => ["explorar", "divulgacao", "conta"].includes(id))).toBe(true);
  });
  it("governança fica toda nos atalhos da gestão", () => {
    expect(governanceConfig.map((s) => s.id)).toEqual(["apresentacoes", "curadoria", "marketing", "comercial", "financeiro", "configuracoes"]);
  });
  it("master vê Painel Master nos atalhos da gestão", () => {
    const items = filterSidebarSections("master", () => true, routeExists, governanceConfig).flatMap((s) => s.items.map((i) => i.id));
    expect(items).toContain("master_panel");
  });
});
