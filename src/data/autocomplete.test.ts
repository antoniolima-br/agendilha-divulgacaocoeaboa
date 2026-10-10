import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchAttractionSuggestions, fetchVenueSuggestions } from "./autocomplete";

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), abortSignal: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc: mocks.rpc } }));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.rpc.mockReturnValue({ abortSignal: mocks.abortSignal });
});

describe.each([
  ["attractions", fetchAttractionSuggestions, "search_atrativos_autocomplete_v2"],
  ["venues", fetchVenueSuggestions, "search_estabelecimentos_autocomplete"],
] as const)("%s autocomplete data", (_, fetchPage, rpcName) => {
  it("preserves inclusive range, search term and abort signal", async () => {
    const rows = [{ id: "one" }];
    const signal = new AbortController().signal;
    mocks.abortSignal.mockResolvedValue({ data: rows, error: null });
    expect(await fetchPage("nome", 12, 24, signal)).toBe(rows);
    expect(mocks.rpc).toHaveBeenCalledWith(rpcName, { _q: "nome", _limit: 13, _offset: 12 });
    expect(mocks.abortSignal).toHaveBeenCalledWith(signal);
  });
  it("preserves null search and empty results", async () => {
    mocks.abortSignal.mockResolvedValue({ data: null, error: null });
    expect(await fetchPage("", 0, 12, new AbortController().signal)).toEqual([]);
    expect(mocks.rpc).toHaveBeenCalledWith(rpcName, { _q: null, _limit: 13, _offset: 0 });
  });
  it("propagates server errors unchanged", async () => {
    const error = { message: "denied" };
    mocks.abortSignal.mockResolvedValue({ data: null, error });
    await expect(fetchPage("nome", 0, 12, new AbortController().signal)).rejects.toBe(error);
  });
});