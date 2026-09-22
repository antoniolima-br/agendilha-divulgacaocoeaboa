import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useAppPermissions } from "@/hooks/useAppPermissions";

  export type UserStatus = "master" | "admin" | "collaborator" | "artist" | "user" | null;

/** Campos que gravamos em user_metadata no cadastro/login. */
interface UserMetadata {
  full_name?: string;
  name?: string;
  phone?: string;
}

export interface UserBadge {
  name: string;
  initials: string;
  status: UserStatus;
  label: string;
  loaded: boolean;
}

function buildInitials(name: string): string {
  const clean = name.trim();
  if (!clean) return "U";
  const parts = clean.split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "U";
}

export function useUserBadge(): UserBadge {
  const { user, isAdmin } = useAuth();
  const { profile, loaded: profileLoaded } = useProfile();
  const { isMaster, isAdmin: hasAdminRole, isCollaborator, collaboratorName, loading } = useAppPermissions();
  const status: UserStatus = !user
    ? null
    : isMaster
      ? "master"
      : hasAdminRole || isAdmin
        ? "admin"
        : profile.role === "artist"
          ? "artist"
          : isCollaborator
            ? "collaborator"
            : "user";

  // Priority: profile name → company → collaborator name → user metadata → email/phone
  const emailLocal = user?.email?.split("@")[0] || "";
  const isPhonePlaceholder = user?.email?.endsWith("@phone.agendilha.app");
  const meta = user?.user_metadata as UserMetadata | undefined;
  const metaName = meta?.full_name || meta?.name || "";
  const fallback = isPhonePlaceholder ? meta?.phone || emailLocal : emailLocal;
  const name =
    profile.responsible_name ||
    profile.company_name ||
    collaboratorName ||
    metaName ||
    fallback ||
    "Usuário";
  const initials = buildInitials(name);
  const labelMap: Record<NonNullable<UserStatus>, string> = {
    master: "Admin Master",
    admin: "Admin",
    collaborator: "Divulgador",
    artist: "Artista",
    user: "Público",
  };
  const label = status ? labelMap[status] : "";

  return {
    name,
    initials,
    status,
    label,
    loaded: profileLoaded && !loading,
  };
}
