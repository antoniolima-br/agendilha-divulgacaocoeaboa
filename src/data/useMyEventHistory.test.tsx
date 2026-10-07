import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { useMyEventHistory } from "./useMyEventHistory";
const mocks = vi.hoisted(() => ({ eq: vi.fn(), from: vi.fn(), query: {} as Record<string, unknown> }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "signed-in-owner" } }) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: mocks.from } }));
function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>;
}
beforeEach(() => {
  vi.clearAllMocks();
  const query = { select: vi.fn().mockReturnThis(), eq: mocks.eq, is: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockResolvedValue({ data: [], error: null }) };
  mocks.eq.mockReturnValue(query);
  mocks.from.mockReturnValue(query);
});
describe("personal history session ownership", () => {
  it("uses the signed-in owner for every query", async () => {
    const { result } = renderHook(() => useMyEventHistory("signed-in-owner"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mocks.eq).toHaveBeenCalledWith("user_id", "signed-in-owner");
  });
  it("does not fetch a caller-supplied alternative owner even for admins", () => {
    renderHook(() => useMyEventHistory("other-owner"), { wrapper });
    expect(mocks.from).not.toHaveBeenCalled();
  });
});