import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFavorites } from "./useFavorites";
import { qk } from "@/data/queryKeys";

const mocks = vi.hoisted(() => ({ insert: vi.fn(), read: vi.fn(), error: vi.fn() }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "owner-a" } }) }));
vi.mock("sonner", () => ({ toast: { error: mocks.error, success: vi.fn() } }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  from: () => ({ select: () => ({ eq: mocks.read }), insert: mocks.insert }),
  channel: () => ({ on() { return this; }, subscribe() { return this; } }), removeChannel: vi.fn(),
} }));
function deferred<T>() { let resolve: (value: T) => void = () => undefined; const promise = new Promise<T>(r => { resolve = r; }); return { promise, resolve }; }
let client: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
describe("favorite write concurrency", () => {
  beforeEach(() => { vi.clearAllMocks(); client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }); mocks.read.mockResolvedValue({ data: [], error: null }); });
  afterEach(() => { cleanup(); client.clear(); });
  it("serializes writes and preserves another event's optimistic intent after a failure", async () => {
    const first = deferred<{ error: Error | null }>();
    const second = deferred<{ error: Error | null }>();
    mocks.insert.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => { result.current.toggleFavorite("event-a"); result.current.toggleFavorite("event-b"); });
    await waitFor(() => expect(client.getQueryData(qk.favorites.byUser("owner-a"))).toEqual(["event-a", "event-b"]));
    expect(mocks.insert).toHaveBeenCalledTimes(1);
    await act(async () => first.resolve({ error: new Error("write failed") }));
    await waitFor(() => expect(mocks.insert).toHaveBeenCalledTimes(2));
    expect(client.getQueryData(qk.favorites.byUser("owner-a"))).toEqual(["event-b"]);
    expect(mocks.read).toHaveBeenCalledTimes(1);
    mocks.read.mockResolvedValue({ data: [{ event_id: "event-b" }], error: null });
    await act(async () => second.resolve({ error: null }));
    await waitFor(() => expect(mocks.read).toHaveBeenCalledTimes(2));
    expect(client.getQueryData(qk.favorites.byUser("owner-a"))).toEqual(["event-b"]);
  });
  it("deduplicates the same event from separate controls", async () => {
    const write = deferred<{ error: null }>();
    mocks.insert.mockReturnValue(write.promise);
    const one = renderHook(() => useFavorites(), { wrapper });
    const two = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(one.result.current.isLoading).toBe(false));
    await waitFor(() => expect(two.result.current.isLoading).toBe(false));
    act(() => { one.result.current.toggleFavorite("event-a"); two.result.current.toggleFavorite("event-a"); });
    await waitFor(() => expect(mocks.insert).toHaveBeenCalledTimes(1));
    await act(async () => write.resolve({ error: null }));
  });
});