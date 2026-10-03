import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUserBadge } from "./useUserBadge";

const mocks = vi.hoisted(() => ({
  profile: null as unknown,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { email: "pessoa@exemplo.com", user_metadata: {} },
    isAdmin: false,
  }),
}));

vi.mock("@/hooks/useProfile", () => ({
  useProfile: () => ({ profile: mocks.profile, loaded: true }),
}));

vi.mock("@/hooks/useAppPermissions", () => ({
  useAppPermissions: () => ({
    isMaster: false,
    isAdmin: false,
    isCollaborator: false,
    collaboratorName: null,
    loading: false,
  }),
}));

describe("useUserBadge", () => {
  beforeEach(() => {
    mocks.profile = null;
  });

  it("usa um nome seguro quando o perfil está ausente", () => {
    const { result } = renderHook(() => useUserBadge());

    expect(result.current.name).toBe("pessoa");
    expect(result.current.status).toBe("user");
  });

  it("ignora nomes inválidos recebidos no perfil", () => {
    mocks.profile = { responsible_name: { url: null }, company_name: null };
    const { result } = renderHook(() => useUserBadge());

    expect(result.current.name).toBe("pessoa");
    expect(result.current.initials).toBe("P");
  });
});