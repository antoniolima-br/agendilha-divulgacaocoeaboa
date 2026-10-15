import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { AuthProvider, useAuth } from "./AuthContext";

const mocks = vi.hoisted(() => ({ getSession: vi.fn(), onChange: vi.fn(), from: vi.fn(), signOut: vi.fn(), error: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getSession: mocks.getSession, onAuthStateChange: mocks.onChange, signOut: mocks.signOut }, from: mocks.from } }));
vi.mock("@/lib/error-handler", () => ({ handleError: mocks.error }));
const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;
function deferred<T>() { let resolve: (value: T) => void = () => undefined; const promise = new Promise<T>(r => { resolve = r; }); return { promise, resolve }; }
const session = { user: { id: "owner-a" } } as Session;
let callback: (event: AuthChangeEvent, session: Session | null) => void;

describe("account session ordering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.onChange.mockImplementation((listener) => { callback = listener; return { data: { subscription: { unsubscribe: vi.fn() } } }; });
    mocks.from.mockImplementation((table) => ({ select: () => ({ eq: () => table === "profiles" ? { maybeSingle: () => Promise.resolve({ data: { must_change_password: false }, error: null }) } : Promise.resolve({ data: [{ role: "master" }], error: null }) }) }));
  });
  afterEach(cleanup);

  it("does not restore an obsolete initial session after sign-out", async () => {
    const initial = deferred<{ data: { session: Session | null } }>();
    mocks.getSession.mockReturnValue(initial.promise);
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => callback("SIGNED_OUT", null));
    await act(async () => initial.resolve({ data: { session } }));
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("clears the previous administrative state before hydrating another account", async () => {
    mocks.getSession.mockResolvedValue({ data: { session } });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isAdmin).toBe(true));
    const next = { user: { id: "owner-b" } } as Session;
    act(() => callback("SIGNED_IN", next));
    expect(result.current.user?.id).toBe("owner-b");
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.loading).toBe(true);
  });

  it("finishes initial loading when session discovery rejects", async () => {
    mocks.getSession.mockRejectedValue(new Error("connection failed"));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mocks.error).toHaveBeenCalled();
  });

  it("reports failed logout rather than silently claiming success", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null } });
    mocks.signOut.mockResolvedValue({ error: new Error("connection failed") });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => { await result.current.signOut(); });
    expect(mocks.error).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ context: "AuthContext:signOut" }));
  });

  it("keeps actions stable on token refresh without re-reading account gates", async () => {
    mocks.getSession.mockResolvedValue({ data: { session } });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    const before = result.current;
    mocks.from.mockClear();
    act(() => callback("TOKEN_REFRESHED", { ...session, access_token: "refreshed" }));
    expect(result.current.signIn).toBe(before.signIn);
    expect(result.current.signUp).toBe(before.signUp);
    expect(result.current.signOut).toBe(before.signOut);
    expect(result.current.refreshMustChangePassword).toBe(before.refreshMustChangePassword);
    expect(result.current.isAdmin).toBe(true);
    expect(mocks.from).not.toHaveBeenCalled();
  });
});