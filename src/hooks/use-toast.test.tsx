import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useToast, toast } from "./use-toast";

describe("toast subscriptions", () => {
  it("keeps mounted subscribers synchronized through updates and unmount", () => {
    vi.useFakeTimers();
    const first = renderHook(() => useToast());
    const second = renderHook(() => useToast());
    act(() => { toast({ title: "one" }); });
    expect(first.result.current.toasts[0]?.title).toBe("one");
    expect(second.result.current.toasts[0]?.title).toBe("one");
    first.unmount();
    act(() => { toast({ title: "two" }); });
    expect(second.result.current.toasts[0]?.title).toBe("two");
    second.unmount();
    vi.clearAllTimers(); vi.useRealTimers();
  });
});