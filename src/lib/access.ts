/** Effective administrative level; higher levels replace, rather than union, workspaces. */
export type AccessRole = "public_guest" | "public_registered" | "promoter" | "collaborator" | "admin" | "financeiro" | "senior" | "master";

export function administrativeRole(roles: string[]): "admin" | "financeiro" | "senior" | "master" | null {
  for (const role of ["master", "senior", "financeiro", "admin"] as const) {
    if (roles.includes(role)) return role;
  }
  return null;
}

export function activeAccessRole(signedIn: boolean, roles: string[]): AccessRole {
  if (!signedIn) return "public_guest";
  return administrativeRole(roles) ?? (roles.includes("collaborator") ? "collaborator" : roles.includes("promoter") ? "promoter" : "public_registered");
}

export function canOrganize(roles: string[], userType: string | null, collaboratorCanSubmit: boolean): boolean {
  const staff = administrativeRole(roles);
  if (staff) return staff !== "financeiro";
  return collaboratorCanSubmit || ["promoter", "promotor", "divulgador"].includes((userType ?? "").toLowerCase());
}