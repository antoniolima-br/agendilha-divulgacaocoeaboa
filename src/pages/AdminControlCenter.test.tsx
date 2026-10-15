import { describe, expect, it } from "vitest";
import { ROUTES, routeExists } from "@/routes/config";
import { ROUTE_PERMISSIONS } from "@/routes/access";
import { computePermissions } from "@/hooks/useAppPermissions";
import { filterSidebarSections } from "@/components/layout/sidebarItems";

describe("central administrativa", () => {
  it("fica visível somente para níveis administrativos operacionais", () => {
    for (const role of ["public_registered", "promoter", "financeiro", "admin", "senior", "master"] as const) {
      const { permissions } = computePermissions({ roleNames: [role], collaborator: null, profileRole: null });
      const visible = filterSidebarSections(role, (permission) => permissions.has(permission), routeExists)
        .flatMap((section) => section.items)
        .some((item) => item.path === ROUTES.ADMIN_CENTRAL);
      expect(visible).toBe(["admin", "senior", "master"].includes(role));
    }
  });

  it("protege a rota com edição de eventos", () => {
    expect(routeExists(ROUTES.ADMIN_CENTRAL)).toBe(true);
    expect(ROUTE_PERMISSIONS[ROUTES.ADMIN_CENTRAL]).toBe("events.update");
  });

  it("usa uma única entrada para Central da Home e Moderação", () => {
    const operation = filterSidebarSections("admin", () => true, routeExists).find((section) => section.id === "curadoria");
    const curation = operation?.items.find((item) => item.id === "curadoria_moderacao");
    expect(curation?.children?.find((item) => item.id === "central_moderacao")?.path).toBe(ROUTES.ADMIN_CENTRAL);
    expect(operation?.items.some((item) => ["central_home", "moderacao"].includes(item.id))).toBe(false);
  });
});