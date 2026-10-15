import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { publicEventsQueryOptions } from "./publicEventsQuery";

const mock = vi.hoisted(() => {
  const query: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of ["select", "in", "or", "eq", "gte", "order", "range"]) query[method] = vi.fn(() => query);
  query.abortSignal = vi.fn();
  return { query, from: vi.fn(() => query) };
});
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: mock.from } }));
vi.mock("@/lib/eventDate", () => ({ PUBLIC_EVENT_STATUSES: ["aprovado", "publicado"], saoPauloTodayISO: () => "2026-10-14", eventDateISO: (date: string) => date?.slice(0, 10) ?? "" }));
beforeEach(() => { vi.clearAllMocks(); });
describe("public event prefetch contract", () => {
  it("reuses cached prefetch without another request and retains visibility filters", async () => {
    mock.query.abortSignal.mockResolvedValue({ data: [{ id: "current", date: "2026-10-14" }, { id: "past", date: "2026-10-13" }], error: null });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    await client.prefetchQuery(publicEventsQueryOptions());
    expect(await client.fetchQuery(publicEventsQueryOptions())).toEqual([{ id: "current", date: "2026-10-14" }]);
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledWith("public_submissions");
    expect(mock.query.range).toHaveBeenCalledWith(0, 14);
    expect(mock.query.eq).toHaveBeenCalledWith("is_archived", false);
    expect(mock.query.gte).toHaveBeenCalledWith("event_day", "2026-10-14");
    expect(mock.query.in).toHaveBeenCalledWith("status", ["aprovado", "publicado"]);
    expect(mock.query.or).toHaveBeenCalledWith("moderation_status.is.null,moderation_status.neq.blocked");
    expect(mock.query.abortSignal.mock.calls[0]?.[0]).toBeInstanceOf(AbortSignal);
    client.clear();
  });
  it("cancels an obsolete request through the query signal", async () => {
    let signal: AbortSignal | undefined;
    mock.query.abortSignal.mockImplementation((next: AbortSignal) => {
      signal = next;
      return new Promise((_resolve, reject) => next.addEventListener("abort", () => reject(new Error("cancelled"))));
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const prefetch = client.prefetchQuery(publicEventsQueryOptions());
    await client.cancelQueries({ queryKey: publicEventsQueryOptions().queryKey });
    await prefetch;
    expect(signal?.aborted).toBe(true);
    client.clear();
  });
});