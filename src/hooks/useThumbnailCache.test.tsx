import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useThumbnailCache } from "./useThumbnailCache";
const mocks = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn(), keys: vi.fn(), del: vi.fn() }));
vi.mock("idb-keyval", () => mocks);
beforeEach(() => { vi.clearAllMocks(); mocks.get.mockResolvedValue("data:image/jpeg;cached"); });
describe("deferred compact thumbnails", () => {
  it("does not read or decode until the native image has loaded", async () => {
    const { result, rerender } = renderHook(({ enabled }) => useThumbnailCache("event", "/official.webp", enabled), { initialProps: { enabled: false } });
    expect(result.current).toBe("/official.webp");
    expect(mocks.get).not.toHaveBeenCalled();
    rerender({ enabled: true });
    await waitFor(() => expect(result.current).toBe("data:image/jpeg;cached"));
    expect(mocks.get).toHaveBeenCalledTimes(1);
  });
  it("does not display a previous URL's thumbnail or apply a late cache response", async () => {
    let finish: (value: string) => void = () => {};
    mocks.get.mockImplementation(() => new Promise<string>(resolve => { finish = resolve; }));
    const { result, rerender } = renderHook(({ url, enabled }) => useThumbnailCache("event", url, enabled), { initialProps: { url: "/first.webp", enabled: true } });
    rerender({ url: "/second.webp", enabled: false });
    await act(async () => finish("data:image/jpeg;old"));
    expect(result.current).toBe("/second.webp");
  });
});