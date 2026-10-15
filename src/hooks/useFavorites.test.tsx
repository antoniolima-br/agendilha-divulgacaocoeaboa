import { renderHook, act, waitFor } from "@testing-library/react";
import { useFavorites } from "./useFavorites";
import { AuthContext } from "@/contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <AuthContext.Provider value={{ user: { id: "user1" }, session: {} } as any}>
      {children}
    </AuthContext.Provider>
  </QueryClientProvider>
);

describe("useFavorites", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
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

    // If it's blocked, supabase.from("user_favorites").insert will only have been called once
    // Wait for everything to settle
    await waitFor(() => expect(result.current.isToggling).toBe(false));

    const insertCalls = (supabase.from as any).mock.results.filter((r: any) => r.type === "return" && r.value.insert);
    // This will actually pass if the bug exists (it will be 1 instead of 2)
    // Actually I want to show it's 1.
    expect(insertCalls.length).toBe(1); 
  });
});
