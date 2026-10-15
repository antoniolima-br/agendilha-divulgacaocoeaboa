import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchAd, fetchAllAds, fetchMyAds, fetchPublishedFlyerAds } from "./queries";

const mock = vi.hoisted(() => {
  const query: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of ["select", "eq", "order", "is", "gte"]) query[method] = vi.fn(() => query);
  for (const method of ["range", "maybeSingle", "limit"]) query[method] = vi.fn();
  return { query, from: vi.fn(() => query) };
});
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: mock.from } }));
const ad = { id: "a1", user_id: "owner", title: "Campanha", description: "Texto", category: "Serviços", contact_whatsapp: "5521999999999", status: "publicado", photos: ["flyer.jpg"] };
beforeEach(() => vi.clearAllMocks());

describe("advertisement read adapters", () => {
  it("does not query without an owner or identifier", async () => {
    expect(await fetchMyAds(undefined)).toEqual([]);
    expect(await fetchAd(undefined)).toBeNull();
    expect(mock.from).not.toHaveBeenCalled();
  });
  it("keeps personal reads filtered and ordered by the caller owner", async () => {
    mock.query.order.mockResolvedValueOnce({ data: [ad], error: null });
    expect(await fetchMyAds("owner")).toHaveLength(1);
    expect(mock.query.eq).toHaveBeenCalledWith("user_id", "owner");
    expect(mock.query.order).toHaveBeenCalledWith("created_at", { ascending: false });
  });
  it("keeps administrative reads paginated and propagates errors", async () => {
    mock.query.range.mockResolvedValueOnce({ data: [ad], error: null });
    expect(await fetchAllAds()).toHaveLength(1);
    expect(mock.query.range).toHaveBeenCalledWith(0, 499);
    const error = new Error("denied");
    mock.query.maybeSingle.mockResolvedValueOnce({ data: null, error });
    await expect(fetchAd("a1")).rejects.toBe(error);
  });
  it("retains flyer status, product exclusion, time window and six-item limit", async () => {
    mock.query.limit.mockResolvedValueOnce({ data: [ad, { ...ad, id: "a2", photos: [] }], error: null });
    const before = Date.now() - 6 * 60 * 60 * 1000;
    expect((await fetchPublishedFlyerAds()).map((item) => item.id)).toEqual(["a1"]);
    expect(mock.query.eq).toHaveBeenCalledWith("status", "publicado");
    expect(mock.query.eq).toHaveBeenCalledWith("ad_type", "flyer");
    expect(mock.query.is).toHaveBeenCalledWith("product_id", null);
    expect(mock.query.limit).toHaveBeenCalledWith(6);
    const timestamp = Date.parse(mock.query.gte.mock.calls[0][1]);
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(Date.now() - 6 * 60 * 60 * 1000);
  });
});