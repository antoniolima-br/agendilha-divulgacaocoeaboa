import { describe, expect, it } from "vitest";
import { activeAccessRole, administrativeRole, canOrganize } from "./access";
import { computePermissions } from "@/hooks/useAppPermissions";
import { filterSidebarSections, type SidebarItem } from "@/components/layout/sidebarItems";
import { ROUTE_PERMISSIONS } from "@/routes/access";
import { ROUTES, routeExists } from "@/routes/config";

function menu(roles: string[], signedIn = true) {
  const { permissions } = computePermissions({ roleNames: roles, collaborator: null, profileRole: roles.includes("promoter") ? "divulgador" : null });
  const sections = filterSidebarSections(activeAccessRole(signedIn, roles), (p) => permissions.has(p), routeExists);
  const flatten = (items: SidebarItem[]): SidebarItem[] => items.flatMap((item) => [item, ...flatten(item.children ?? [])]);
  return sections.flatMap((section) => flatten(section.items));
}

describe("effective workspaces", () => {
  it("higher roles replace mixed lower privileges", () => {
    expect(administrativeRole(["admin", "financeiro"])).toBe("financeiro");
    expect(administrativeRole(["financeiro", "senior"])).toBe("senior");
    expect(administrativeRole(["senior", "master"])).toBe("master");
  });
  it("guest sees public events and account entry, not contracted ads or private tools", () => {
    const paths = menu([], false).map((item) => item.path);
    expect(paths).toContain(ROUTES.AGENDA);
    expect(paths).not.toContain(ROUTES.ANUNCIO_NOVO);
    expect(paths).not.toContain(ROUTES.SEU_RADAR);
    expect(paths.some((path) => path.startsWith("/admin"))).toBe(false);
  });
  it("public users see radar but no organizer or financial tools", () => {
    const paths = menu(["user"]).map((item) => item.path);
    expect(paths).toContain(ROUTES.SEU_RADAR);
    expect(paths).not.toContain(ROUTES.MEUS_EVENTOS);
    expect(paths).not.toContain(ROUTES.ADMIN_FINANCEIRO);
  });
  it("promoters see only personal operations", () => {
    const paths = menu(["promoter"]).map((item) => item.path);
    expect(paths).toContain(ROUTES.MEUS_EVENTOS);
    expect(paths).toContain(ROUTES.ENVIAR_EVENTO);
    expect(paths).not.toContain(ROUTES.ADMIN_FINANCEIRO);
    expect(paths).not.toContain(ROUTES.ADMIN_APROVAR_EVENTOS);
  });
  it.each(["admin", "senior", "master"])("%s sees operations, not public preferences", (role) => {
    const paths = menu([role]).map((item) => item.path);
    expect(paths).toContain(ROUTES.ADMIN_FINANCEIRO);
    expect(paths).toContain(ROUTES.ADMIN_APROVAR_EVENTOS);
    expect(paths).not.toContain(ROUTES.SEU_RADAR);
  });
  it("finance-only remains isolated even with admin, profile and collaborator", () => {
    const input = { roleNames: ["admin", "financeiro"], profileRole: "divulgador", collaborator: { is_active: true, can_submit: true, can_edit: true, can_approve: true, can_delete: true } };
    const { permissions } = computePermissions(input);
    expect(permissions.has("events.approve")).toBe(false);
    expect(permissions.has("events.create")).toBe(false);
    expect(permissions.has("users.read")).toBe(false);
    expect(permissions.has("finance.release")).toBe(true);
    expect(canOrganize(input.roleNames, input.profileRole, true)).toBe(false);
    const paths = menu(input.roleNames).map((item) => item.path);
    expect(paths).toContain(ROUTES.ADMIN_ANUNCIOS);
    expect(paths).toContain(ROUTES.ADMIN_FINANCEIRO);
    expect(paths).not.toContain(ROUTES.ADMIN_APROVAR_EVENTOS);
    expect(paths).not.toContain(ROUTES.MEUS_EVENTOS);
    expect(paths).not.toContain(ROUTES.ADMIN_USERS);
  });
  it("admin reads users but only master changes users and credentials", () => {
    for (const role of ["admin", "senior", "master"]) {
      const { permissions } = computePermissions({ roleNames: [role], profileRole: null, collaborator: null });
      expect(permissions.has("users.read")).toBe(true);
      expect(permissions.has("users.update")).toBe(role === "master");
      expect(permissions.has("users.reset")).toBe(role === "master");
    }
  });
  it("removes empty sections and branches with nonexistent routes", () => {
    expect(filterSidebarSections("master", () => true, () => false)).toEqual([]);
  });
  it("guards every existing administration route by capability", () => {
    expect(ROUTE_PERMISSIONS[ROUTES.ADMIN_USERS]).toBe("users.read");
    expect(ROUTE_PERMISSIONS[ROUTES.ADMIN_COLLABORATORS]).toBe("users.update");
    expect(ROUTE_PERMISSIONS[ROUTES.ADMIN_ANUNCIOS]).toBe("ads.manage");
  });
});