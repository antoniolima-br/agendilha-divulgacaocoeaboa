import { describe, expect, it, vi } from "vitest";
import { fetchAllPages } from "./pagination";

describe("fetchAllPages", () => {
  it("collects ordered pages using inclusive ranges", async () => {
    const page = vi.fn().mockResolvedValueOnce({ data: [1, 2], error: null })
      .mockResolvedValueOnce({ data: [3], error: null });
    expect(await fetchAllPages(page, 2)).toEqual([1, 2, 3]);
    expect(page.mock.calls).toEqual([[0, 1], [2, 3]]);
  });
  it("checks the next page after an exactly full page", async () => {
    const page = vi.fn().mockResolvedValueOnce({ data: [1, 2], error: null })
      .mockResolvedValueOnce({ data: null, error: null });
    expect(await fetchAllPages(page, 2)).toEqual([1, 2]);
    expect(page).toHaveBeenCalledTimes(2);
  });
  it("returns an empty list without extra requests", async () => {
    const page = vi.fn().mockResolvedValue({ data: [], error: null });
    expect(await fetchAllPages(page)).toEqual([]);
    expect(page).toHaveBeenCalledWith(0, 499);
    expect(page).toHaveBeenCalledTimes(1);
  });
  it("propagates page errors without returning partial results", async () => {
    const error = new Error("failed");
    const page = vi.fn().mockResolvedValueOnce({ data: [1, 2], error: null })
      .mockResolvedValueOnce({ data: null, error });
    await expect(fetchAllPages(page, 2)).rejects.toBe(error);
  });
});