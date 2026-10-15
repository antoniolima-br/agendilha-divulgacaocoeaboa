import { renderHook, act, waitFor } from "@testing-library/react";
import { useFavorites } from "./useFavorites";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe("useFavorites", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: { id: "user1" } });
  });

  it("should block concurrent favorites for different events (BUG)", async () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // First favorite
    act(() => {
      result.current.toggleFavorite("event1");
    });

    // Second favorite for a DIFFERENT event while first is pending
    act(() => {
      result.current.toggleFavorite("event2");
    });

    // Wait for everything to settle
    await waitFor(() => expect(result.current.isToggling).toBe(false));

    const fromCalls = (supabase.from as any).mock.calls.filter((call: any) => call[0] === "user_favorites");
    // We expect 2 inserts, but we might get 1 if the bug exists.
    // toggleFavorite calls toggleFavoriteMutation.mutate
    // If we call it twice, we should have two supabase calls.
    expect(fromCalls.length).toBe(1); 
  });
});
