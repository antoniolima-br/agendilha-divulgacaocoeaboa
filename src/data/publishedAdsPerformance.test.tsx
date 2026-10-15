import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePublishedAds, usePublishedRadarAds } from "./useAds";

const mock = vi.hoisted(() => {
  const query: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of ["select", "eq", "or", "order"]) query[method] = vi.fn(() => query);
  query.range = vi.fn(() => query);
  query.abortSignal = vi.fn();
  return { query, from: vi.fn(() => query) };
});
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: mock.from } }));
const ad = (index: number) => ({ id: `ad-${index}`, user_id: "owner", title: "Campanha", description: "Anúncio", category: "Serviços", contact_whatsapp: "5521999999999", status: "publicado", target_regions: [], product_active: true });
beforeEach(() => { vi.clearAllMocks(); });
describe("public advertisement request sharing", () => {
  it("fetches every page once for carousel and Radar consumers with abort signals", async () => {
    mock.query.abortSignal.mockResolvedValueOnce({ data: Array.from({ length: 500 }, (_, index) => ad(index)), error: null })
      .mockResolvedValueOnce({ data: [ad(500)], error: null });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const hook = renderHook(() => ({ carousel: usePublishedAds(), radar: usePublishedRadarAds([]) }), { wrapper });
    await waitFor(() => expect(hook.result.current.carousel.isSuccess).toBe(true));
    expect(hook.result.current.carousel.data).toHaveLength(501);
    expect(mock.from).toHaveBeenCalledTimes(2);
    expect(mock.query.range.mock.calls).toEqual([[0, 499], [500, 999]]);
    expect(mock.query.order).toHaveBeenCalledWith("id", { ascending: true });
    expect(mock.query.eq).toHaveBeenCalledWith("status", "publicado");
    expect(mock.query.abortSignal.mock.calls[0]?.[0]).toBeInstanceOf(AbortSignal);
    act(() => hook.rerender());
    expect(mock.from).toHaveBeenCalledTimes(2);
    hook.unmount();
    client.clear();
  });
});