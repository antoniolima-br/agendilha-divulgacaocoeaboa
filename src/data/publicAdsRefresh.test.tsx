import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePublicAdsRefresh } from "./publicAdsRefresh";

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
describe("shared public advertisement clock", () => {
  it("refreshes once for multiple placements and releases the final timer", () => {
    vi.useFakeTimers();
    const client = new QueryClient();
    const invalidate = vi.spyOn(client, "invalidateQueries").mockResolvedValue();
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const first = renderHook(() => usePublicAdsRefresh(), { wrapper });
    const second = renderHook(() => usePublicAdsRefresh(), { wrapper });
    act(() => vi.advanceTimersByTime(60_000));
    expect(invalidate).toHaveBeenCalledTimes(1);
    first.unmount();
    act(() => vi.advanceTimersByTime(60_000));
    expect(invalidate).toHaveBeenCalledTimes(2);
    second.unmount();
    act(() => vi.advanceTimersByTime(120_000));
    expect(invalidate).toHaveBeenCalledTimes(2);
  });
  it("pauses while hidden, refreshes on return and keeps clients isolated", () => {
    vi.useFakeTimers();
    const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    const clients = [new QueryClient(), new QueryClient()];
    const spies = clients.map((client) => vi.spyOn(client, "invalidateQueries").mockResolvedValue());
    const hooks = clients.map((client) => renderHook(() => usePublicAdsRefresh(), {
      wrapper: ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
    }));
    act(() => {
      visibility.mockReturnValue("hidden");
      document.dispatchEvent(new Event("visibilitychange"));
      vi.advanceTimersByTime(120_000);
    });
    spies.forEach((spy) => expect(spy).not.toHaveBeenCalled());
    act(() => {
      visibility.mockReturnValue("visible");
      document.dispatchEvent(new Event("visibilitychange"));
    });
    spies.forEach((spy) => expect(spy).toHaveBeenCalledTimes(1));
    hooks.forEach((hook) => hook.unmount());
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    spies.forEach((spy) => expect(spy).toHaveBeenCalledTimes(1));
  });
});