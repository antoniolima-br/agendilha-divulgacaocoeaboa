import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCuration } from "./useCuration";

const mocks = vi.hoisted(() => ({ from: vi.fn(), eq: vi.fn(), in: vi.fn(), range: vi.fn() }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "staff" } }) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: mocks.from } }));
function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>;
}
beforeEach(() => {
  vi.clearAllMocks();
  const query = { select: vi.fn().mockReturnThis(), is: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), eq: mocks.eq, in: mocks.in, range: mocks.range };
  mocks.eq.mockReturnValue(query);
  mocks.in.mockReturnValue(query);
  mocks.from.mockReturnValue(query);
  mocks.range.mockResolvedValue({ data: [], error: null });
});
describe("curation pagination", () => {
  it("reapplies pending filters for every page", async () => {
    const first = Array.from({ length: 500 }, (_, i) => ({ id: String(i) }));
    mocks.range.mockResolvedValueOnce({ data: first, error: null }).mockResolvedValueOnce({ data: [{ id: "last" }], error: null });
    const { result } = renderHook(() => useCuration(true, "pending"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(501);
    expect(mocks.eq.mock.calls).toEqual([["status", "pendente"], ["status", "pendente"]]);
    expect(mocks.range.mock.calls).toEqual([[0, 499], [500, 999]]);
  });
  it("preserves approved status selection", async () => {
    const { result } = renderHook(() => useCuration(true, "approved"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mocks.in).toHaveBeenCalledWith("status", ["aprovado", "publicado", "divulgado"]);
  });
  it("does not query when disabled", () => {
    renderHook(() => useCuration(false, "pending"), { wrapper });
    expect(mocks.from).not.toHaveBeenCalled();
  });
});