import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { usePublicEventsRealtime } from "./publicEventsRealtime";

const mock = vi.hoisted(() => {
  const listeners: (() => void)[] = [];
  const channel = { on: vi.fn((_type, _filter, callback) => { listeners.push(callback); return channel; }), subscribe: vi.fn(() => channel) };
  return { listeners, channel, create: vi.fn(() => channel), remove: vi.fn() };
});
vi.mock("@/integrations/supabase/client", () => ({ supabase: { channel: mock.create, removeChannel: mock.remove } }));
afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); mock.listeners.length = 0; });
describe("public event subscription sharing", () => {
  it("shares across consumers, batches bursts, and cleans up only after the last consumer", () => {
    vi.useFakeTimers();
    const client = new QueryClient();
    const invalidate = vi.spyOn(client, "invalidateQueries").mockResolvedValue();
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const first = renderHook(() => usePublicEventsRealtime(), { wrapper });
    const second = renderHook(() => usePublicEventsRealtime(), { wrapper });
    act(() => vi.advanceTimersByTime(2100));
    expect(mock.create).toHaveBeenCalledTimes(1);
    act(() => { mock.listeners.forEach((fn) => { fn(); fn(); }); vi.advanceTimersByTime(750); });
    expect(invalidate).toHaveBeenCalledTimes(1);
    first.unmount();
    expect(mock.remove).not.toHaveBeenCalled();
    second.unmount();
    expect(mock.remove).toHaveBeenCalledTimes(1);
  });
  it("does not connect for disabled consumers or after an early teardown", () => {
    vi.useFakeTimers();
    const client = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const disabled = renderHook(() => usePublicEventsRealtime(false), { wrapper });
    const early = renderHook(() => usePublicEventsRealtime(), { wrapper });
    early.unmount();
    act(() => vi.advanceTimersByTime(2500));
    expect(mock.create).not.toHaveBeenCalled();
    disabled.unmount();
  });
});