import type { UserWithRole } from "./types";

/** Presentation categories only; never use these groups as permission authority. */
/** Agrupa o usuário numa "gaveta" só: Admin, Divulgador, Artista, Estabelecimento ou Público. */
export function userGroup(u: Pick<UserWithRole, "status" | "user_type">): string {
  if (u.status === "admin" || u.status === "master") return "admin";
  if (u.status === "artist" || u.user_type === "artist") return "artist";
  if (u.user_type === "estabelecimento") return "estabelecimento";
  if (u.status === "collaborator" || u.user_type === "divulgador" || u.user_type === "promotor" || u.user_type === "promoter")
    return "divulgador";
  return "usuario";
}

export const GROUP_LABELS: Record<string, string> = {
  admin: "Administradores",
  divulgador: "Divulgadores",
  artist: "Músicos / Artistas",
  estabelecimento: "Estabelecimentos",
  usuario: "Usuários públicos",
};

export const GROUP_ORDER = ["admin", "divulgador", "artist", "estabelecimento", "usuario"];

