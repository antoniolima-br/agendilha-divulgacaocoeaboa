import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { useMyPublishedEvents } from "./useMyPublishedEvents";
const mocks = vi.hoisted(() => ({ user: { id: "owner" } as { id: string } | null, from: vi.fn(), eq: vi.fn(), in: vi.fn() }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: mocks.from } }));
function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>;
}
beforeEach(() => {
  vi.clearAllMocks(); mocks.user = { id: "owner" };
  const query = { select: vi.fn().mockReturnThis(), eq: mocks.eq, in: mocks.in, or: vi.fn().mockReturnThis(), gte: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockResolvedValue({ data: [], error: null }) };
  mocks.eq.mockReturnValue(query); mocks.in.mockReturnValue(query); mocks.from.mockReturnValue(query);
});
describe("consulta pessoal publicada", () => {
  it("consulta somente a view pública e o dono autenticado", async () => {
    const { result } = renderHook(() => useMyPublishedEvents(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mocks.from).toHaveBeenCalledWith("public_submissions");
    expect(mocks.eq).toHaveBeenCalledWith("user_id", "owner");
    expect(mocks.in).toHaveBeenCalledWith("status", ["aprovado", "publicado", "divulgado"]);
  });
  it("não consulta eventos sem sessão", () => {
    mocks.user = null;
    renderHook(() => useMyPublishedEvents(), { wrapper });
    expect(mocks.from).not.toHaveBeenCalled();
  });
});