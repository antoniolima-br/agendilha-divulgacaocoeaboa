import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkAttractionSchedule, useAttractionSchedule } from "./useAttractionSchedule";

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), abortSignal: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc: mocks.rpc } }));
const input = { attractionName: "Artista", date: "2026-12-20", startTime: "18:00" };
beforeEach(() => { vi.useFakeTimers(); vi.clearAllMocks(); mocks.rpc.mockReturnValue({ abortSignal: mocks.abortSignal }); });
afterEach(() => vi.useRealTimers());

describe("schedule request lifecycle", () => {
  it("passes the signal and keeps server conflicts intact", async () => {
    const signal = new AbortController().signal;
    const entries = [{ event_id: "event", assessment: "conflict" }];
    mocks.abortSignal.mockResolvedValue({ data: entries, error: null });
    expect(await checkAttractionSchedule(input, signal)).toBe(entries);
    expect(mocks.abortSignal).toHaveBeenCalledWith(signal);
  });
  it("aborts superseded checks and unmounts without applying stale responses", async () => {
    let finish: (value: unknown) => void = () => {};
    mocks.abortSignal.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const { result, rerender, unmount } = renderHook(({ startTime }) => useAttractionSchedule({ ...input, startTime }), { initialProps: { startTime: "18:00" } });
    await act(async () => { await vi.advanceTimersByTimeAsync(300); });
    const first = mocks.abortSignal.mock.calls[0][0] as AbortSignal;
    const firstFinish = finish;
    rerender({ startTime: "19:00" });
    expect(first.aborted).toBe(true);
    await act(async () => { firstFinish({ data: [{ assessment: "conflict" }], error: null }); await vi.advanceTimersByTimeAsync(300); });
    expect(result.current.entries).toEqual([]);
    expect(result.current.failed).toBe(false);
    const second = mocks.abortSignal.mock.calls[1][0] as AbortSignal;
    unmount();
    expect(second.aborted).toBe(true);
  });
  it("preserves direct submit-time checks without an optional signal", async () => {
    mocks.rpc.mockResolvedValue({ data: [], error: null });
    expect(await checkAttractionSchedule(input)).toEqual([]);
    expect(mocks.abortSignal).not.toHaveBeenCalled();
  });
});