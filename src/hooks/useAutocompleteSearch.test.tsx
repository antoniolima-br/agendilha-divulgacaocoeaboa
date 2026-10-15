import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAutocompleteSearch } from "./useAutocompleteSearch";

describe("autocomplete request lifecycle", () => {
  it("retains recent terms and evicts the least recently used search", async () => {
    const fetchPage = vi.fn(async (term: string) => [term]);
    const { result, rerender } = renderHook(({ term }) => useAutocompleteSearch({ term, fetchPage, debounceMs: 0, maxCachedTerms: 2 }), { initialProps: { term: "first" } });
    await waitFor(() => expect(result.current.items).toEqual(["first"]));
    rerender({ term: "second" });
    await waitFor(() => expect(result.current.items).toEqual(["second"]));
    rerender({ term: "first" });
    expect(result.current.items).toEqual(["first"]);
    expect(fetchPage).toHaveBeenCalledTimes(2);
    rerender({ term: "third" });
    await waitFor(() => expect(result.current.items).toEqual(["third"]));
    rerender({ term: "second" });
    await waitFor(() => expect(fetchPage).toHaveBeenCalledTimes(4));
    expect(result.current.items).toEqual(["second"]);
  });

  it("refetches when the page size changes instead of reusing incompatible pagination", async () => {
    const fetchPage = vi.fn(async (_q: string, _from: number, to: number) => Array.from({ length: to + 1 }, (_, i) => String(i)));
    const { result, rerender } = renderHook(({ pageSize }) => useAutocompleteSearch({ term: "first", fetchPage, pageSize, debounceMs: 0 }), { initialProps: { pageSize: 1 } });
    await waitFor(() => expect(result.current.items).toEqual(["0"]));
    rerender({ pageSize: 2 });
    await waitFor(() => expect(result.current.items).toEqual(["0", "1"]));
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });
  it("does not overwrite a cached term with a late response", async () => {
    let finish: (rows: string[]) => void = () => {};
    const fetchPage = vi.fn((q: string) => q === "first" ? Promise.resolve(["first-result"]) : new Promise<string[]>(resolve => { finish = resolve; }));
    const { result, rerender } = renderHook(({ term }) => useAutocompleteSearch({ term, fetchPage, debounceMs: 0 }), { initialProps: { term: "first" } });
    await waitFor(() => expect(result.current.items).toEqual(["first-result"]));
    rerender({ term: "second" });
    await waitFor(() => expect(fetchPage).toHaveBeenCalledTimes(2));
    rerender({ term: "first" });
    act(() => finish(["late-result"]));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual(["first-result"]);
  });

  it("aborts and ignores results after closing the dropdown", async () => {
    let finish: (rows: string[]) => void = () => {};
    let signal: AbortSignal | undefined;
    const fetchPage = vi.fn((_q: string, _from: number, _to: number, current: AbortSignal) => {
      signal = current;
      return new Promise<string[]>(resolve => { finish = resolve; });
    });
    const { result, rerender } = renderHook(({ enabled }) => useAutocompleteSearch({ term: "first", fetchPage, enabled, debounceMs: 0 }), { initialProps: { enabled: true } });
    await waitFor(() => expect(fetchPage).toHaveBeenCalledTimes(1));
    rerender({ enabled: false });
    expect(signal?.aborted).toBe(true);
    act(() => finish(["late-result"]));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual([]);
  });

  it("reports a failure without treating it as a cached empty result", async () => {
    const fetchPage = vi.fn().mockRejectedValueOnce(new Error("failed")).mockResolvedValue(["recovered"]);
    const { result, rerender } = renderHook(({ enabled }) => useAutocompleteSearch<string>({ term: "first", fetchPage, enabled, debounceMs: 0 }), { initialProps: { enabled: true } });
    await waitFor(() => expect(result.current.error?.message).toBe("failed"));
    rerender({ enabled: false }); rerender({ enabled: true });
    await waitFor(() => expect(result.current.items).toEqual(["recovered"]));
    expect(result.current.error).toBeNull();
  });

  it("deduplicates immediate pagination requests", async () => {
    let finish: (rows: string[]) => void = () => {};
    const fetchPage = vi.fn().mockResolvedValueOnce(["first", "next"]).mockImplementation(() => new Promise<string[]>(resolve => { finish = resolve; }));
    const { result } = renderHook(() => useAutocompleteSearch<string>({ term: "first", fetchPage, debounceMs: 0, pageSize: 1 }));
    await waitFor(() => expect(result.current.hasMore).toBe(true));
    act(() => { void result.current.loadMore(); void result.current.loadMore(); });
    expect(fetchPage).toHaveBeenCalledTimes(2);
    act(() => finish(["second"]));
    await waitFor(() => expect(result.current.items).toEqual(["first", "second"]));
  });
});