/** Effective administrative level; higher levels replace, rather than union, workspaces. */
export type AccessRole = "public_guest" | "public_registered" | "promoter" | "collaborator" | "admin" | "financeiro" | "senior" | "master" | "sector";

export function administrativeRole(roles: string[]): "admin" | "financeiro" | "senior" | "master" | null {
  for (const role of ["master", "senior", "financeiro", "admin"] as const) {
    if (roles.includes(role)) return role;
  }
  return null;
}

export function isAdministrativeRole(role: ReturnType<typeof administrativeRole>): boolean {
  return role === "admin" || role === "senior" || role === "master";
}

export function activeAccessRole(signedIn: boolean, roles: string[]): AccessRole {
  if (!signedIn) return "public_guest";
  if (!roles.some((role) => ["master", "senior"].includes(role)) && roles.some((role) => ["comercial", "marketing", "administracao", "desenvolvimento"].includes(role))) return "sector";
  return administrativeRole(roles) ?? (roles.includes("collaborator") ? "collaborator" : roles.includes("promoter") ? "promoter" : "public_registered");
}

export function canOrganize(roles: string[], userType: string | null, collaboratorCanSubmit: boolean): boolean {
  if (!roles.some((role) => ["master", "senior"].includes(role)) && roles.some((role) => ["comercial", "marketing", "administracao", "desenvolvimento"].includes(role))) return false;
  const staff = administrativeRole(roles);
  if (staff) return staff !== "financeiro";
  return collaboratorCanSubmit || ["promoter", "promotor", "divulgador"].includes((userType ?? "").toLowerCase());
}