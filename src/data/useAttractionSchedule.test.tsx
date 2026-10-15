import { renderHook, act, waitFor } from "@testing-library/react";
import { useAttractionSchedule, checkAttractionSchedule } from "./useAttractionSchedule";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: vi.fn(() => ({
      abortSignal: vi.fn().mockReturnThis(),
      then: vi.fn((cb) => Promise.resolve({ data: [], error: null }).then(cb)),
    })),
  },
}));

describe("useAttractionSchedule", () => {
  it("should show stale data while loading new inputs (BUG)", async () => {
    // Initial state with conflict
    (supabase.rpc as any).mockReturnValueOnce({
        abortSignal: vi.fn().mockReturnThis(),
        then: vi.fn((cb) => Promise.resolve({ data: [{ assessment: "conflict" }], error: null }).then(cb)),
    });

    const { result, rerender } = renderHook((props) => useAttractionSchedule(props), {
      initialProps: {
        attractionName: "A",
        date: "2023-01-01",
        startTime: "10:00",
      }
    });

    // Wait for initial load
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasConflict).toBe(true);

    // Change inputs to something that should be safe
    (supabase.rpc as any).mockReturnValueOnce({
        abortSignal: vi.fn().mockReturnThis(),
        then: vi.fn((cb) => new Promise(r => setTimeout(() => r({ data: [], error: null }), 100)).then(cb)),
    });

    act(() => {
      rerender({
        attractionName: "A",
        date: "2023-01-01",
        startTime: "14:00",
      });
    });

    // IMMEDIATELY after rerender, it should be loading, but what is hasConflict?
    // In the current bug, hasConflict will STILL be true (from previous results)
    expect(result.current.loading).toBe(true);
    expect(result.current.hasConflict).toBe(true); // This is STALE! Should be false or unknown.
    
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasConflict).toBe(false);
  });
});
