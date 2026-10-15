import { renderHook, act, waitFor } from "@testing-library/react";
import { useAttractionSchedule } from "./useAttractionSchedule";
import { vi, describe, it, expect } from "vitest";
import { supabase } from "@/integrations/supabase/client";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

describe("useAttractionSchedule", () => {
  it("should clear stale conflict data while loading new inputs (FIXED)", async () => {
    // Initial state with conflict
    (supabase.rpc as any).mockReturnValue({
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

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasConflict).toBe(true);

    // Change inputs to something that should be safe
    (supabase.rpc as any).mockReturnValue({
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

    // IMMEDIATELY after rerender, it should be loading, and hasConflict should be CLEARED
    expect(result.current.loading).toBe(true);
    expect(result.current.hasConflict).toBe(false); // Fix verified: no longer stale true
    
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasConflict).toBe(false);
  });
});
