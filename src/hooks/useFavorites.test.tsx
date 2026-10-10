import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { qk } from "@/data/queryKeys";
import { useFavorites } from "./useFavorites";

const mocks = vi.hoisted(() => ({
  user: { id: "owner" } as { id: string } | null,
  from: vi.fn(), insert: vi.fn(), remove: vi.fn(), error: vi.fn(), success: vi.fn(),
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock("sonner", () => ({ toast: { error: mocks.error, success: mocks.success } }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  from: mocks.from,
  channel: () => ({ on() { return this; }, subscribe() { return this; } }),
  removeChannel: vi.fn(),
} }));

function setup(initial: string[] = []) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } } });
  client.setQueryData(qk.favorites.byUser("owner"), initial);
  const invalidate = vi.spyOn(client, "invalidateQueries").mockResolvedValue();
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, wrapper, invalidate };
}

beforeEach(() => {
  vi.clearAllMocks(); mocks.user = { id: "owner" };
  mocks.insert.mockResolvedValue({ error: null });
  mocks.remove.mockResolvedValue({ error: null });
  const deletion = { eq: vi.fn() };
  deletion.eq.mockImplementation((column: string) => column === "event_id" ? mocks.remove() : deletion);
  mocks.from.mockReturnValue({ insert: mocks.insert, delete: () => deletion });
});

describe("favorite write isolation", () => {
  it("deduplicates synchronous clicks across mounted controls", async () => {
    const { wrapper, client } = setup();
    const { result } = renderHook(() => ({ first: useFavorites(), second: useFavorites() }), { wrapper });
    act(() => { result.current.first.toggleFavorite("event"); result.current.second.toggleFavorite("event"); });
    await waitFor(() => expect(mocks.insert).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.first.isToggling).toBe(false));
    expect(client.getQueryData(qk.favorites.byUser("owner"))).toEqual(["event"]);
    expect(mocks.insert).toHaveBeenCalledWith({ user_id: "owner", event_id: "event" });
  });

  it("uses explicit intent to remove, then permits another toggle", async () => {
    const { wrapper, client } = setup(["event"]);
    const { result } = renderHook(() => useFavorites(), { wrapper });
    act(() => result.current.toggleFavorite("event"));
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.isToggling).toBe(false));
    expect(client.getQueryData(qk.favorites.byUser("owner"))).toEqual([]);
    act(() => result.current.toggleFavorite("event"));
    await waitFor(() => expect(mocks.insert).toHaveBeenCalledTimes(1));
  });

  it("rolls back the original owner's cache after a session change", async () => {
    let finish: (value: { error: Error | null }) => void = () => {};
    mocks.insert.mockReturnValue(new Promise(resolve => { finish = resolve; }));
    const { wrapper, client, invalidate } = setup();
    client.setQueryData(qk.favorites.byUser("other"), ["other-event"]);
    const { result, rerender } = renderHook(() => useFavorites(), { wrapper });
    act(() => result.current.toggleFavorite("event"));
    await waitFor(() => expect(mocks.insert).toHaveBeenCalledTimes(1));
    mocks.user = { id: "other" };
    rerender();
    act(() => finish({ error: new Error("rejected") }));
    await waitFor(() => expect(mocks.error).toHaveBeenCalled());
    expect(client.getQueryData(qk.favorites.byUser("owner"))).toEqual([]);
    expect(client.getQueryData(qk.favorites.byUser("other"))).toEqual(["other-event"]);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: qk.favorites.byUser("owner") });
  });

  it("does not write without a session", () => {
    mocks.user = null;
    const { wrapper } = setup();
    const { result } = renderHook(() => useFavorites(), { wrapper });
    act(() => result.current.toggleFavorite("event"));
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.error).toHaveBeenCalledWith("Você precisa entrar para favoritar eventos.");
  });
});