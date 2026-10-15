import { afterEach, describe, expect, it, vi } from "vitest";
import { createQueryInvalidationBatch } from "./queryInvalidationBatch";

afterEach(() => vi.useRealTimers());
describe("batched query invalidation", () => {
  it("coalesces repeated keys without dropping sibling families", () => {
    vi.useFakeTimers();
    const invalidate = vi.fn();
    const batch = createQueryInvalidationBatch(invalidate);
    batch.schedule(["events"]);
    vi.advanceTimersByTime(500);
    batch.schedule(["ratings"]);
    batch.schedule(["events"]);
    vi.advanceTimersByTime(749);
    expect(invalidate).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(invalidate.mock.calls).toEqual([[["events"]], [["ratings"]]]);
  });
  it("cancels outstanding work on teardown", () => {
    vi.useFakeTimers();
    const invalidate = vi.fn();
    const batch = createQueryInvalidationBatch(invalidate);
    batch.schedule(["events"]);
    batch.cancel();
    vi.runAllTimers();
    expect(invalidate).not.toHaveBeenCalled();
  });
  it("flushes continuous changes at the deadline rather than starving refreshes", () => {
    vi.useFakeTimers();
    const invalidate = vi.fn();
    const batch = createQueryInvalidationBatch(invalidate);
    for (let index = 0; index < 6; index++) {
      batch.schedule(["events"]);
      vi.advanceTimersByTime(500);
    }
    expect(invalidate).toHaveBeenCalledTimes(1);
    batch.schedule(["ratings"]);
    vi.advanceTimersByTime(750);
    expect(invalidate.mock.calls).toEqual([[["events"]], [["ratings"]]]);
    batch.cancel();
    vi.runAllTimers();
    expect(invalidate).toHaveBeenCalledTimes(2);
  });
});