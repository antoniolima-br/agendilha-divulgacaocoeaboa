import { describe, expect, it } from "vitest";
import { filterSidebarSections } from "./sidebarItems";

const hasShortcut = (role: Parameters<typeof filterSidebarSections>[0]) =>
  filterSidebarSections(role, () => true, () => true).some((s) => s.items.some((i) => i.id === "intranet_portal"));

describe("atalho da Gestão setorial", () => {
  it.each(["public_guest", "public_registered", "promoter", "collaborator", "admin"] as const)("fica oculto para %s", (role) => {
    expect(hasShortcut(role)).toBe(false);
  });
  it.each(["master", "senior", "financeiro", "sector"] as const)("aparece para %s", (role) => {
    expect(hasShortcut(role)).toBe(true);
  });
});
