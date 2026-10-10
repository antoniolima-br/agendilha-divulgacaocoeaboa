import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { useEvents } from "./events";
vi.mock("./usePublicEvents", () => ({ usePublicEvents: () => ({ data: [{ id: "event-1" }], isLoading: false, isError: false, refetch: vi.fn() }) }));
const read = vi.hoisted(() => vi.fn(() => ({ select: () => ({ in: () => Promise.resolve({ data: [], error: null }) }) })));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: read } }));
describe("optional event ratings", () => {
  it("renders events without unused ratings requests or a ratings loading gate", () => {
    const client = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => useEvents({ includeRatings: false }), { wrapper });
    expect(result.current.events).toHaveLength(1);
    expect(result.current.isLoading).toBe(false);
    expect(read).not.toHaveBeenCalled();
  });
  it("preserves the default ratings contract for existing consumers", async () => {
    const client = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => useEvents(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(read).toHaveBeenCalledWith("event_ratings_summary");
  });
});