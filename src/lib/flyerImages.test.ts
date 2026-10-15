import { beforeEach, describe, expect, it, vi } from "vitest";
import { flyerListingUrl, uploadFlyerImage } from "./flyerImages";
const mocks = vi.hoisted(() => ({ upload: vi.fn(), remove: vi.fn(), compress: vi.fn(), prepare: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { storage: { from: () => ({ upload: mocks.upload, remove: mocks.remove, getPublicUrl: (path: string) => ({ data: { publicUrl: `/media/${path}` } }) }) } } }));
vi.mock("./mediaCompression", () => ({ compressImage: mocks.compress }));
vi.mock("./uploadImage", () => ({ prepareUploadImage: mocks.prepare, isAnimatedWebp: async () => false }));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.upload.mockResolvedValue({ error: null });
  mocks.remove.mockResolvedValue({ error: null });
  mocks.prepare.mockResolvedValue(new File(["official"], "art.webp", { type: "image/webp" }));
  mocks.compress.mockResolvedValue({ file: new File(["thumb"], "art.webp", { type: "image/webp" }), preview: "blob:thumb" });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
});
describe("paired flyer uploads", () => {
  it("creates a 480px lightweight listing image before publishing the official artwork URL", async () => {
    const url = await uploadFlyerImage(new File(["input"], "art.png"), "owner/art.png");
    expect(mocks.compress.mock.calls[0]?.[1]).toEqual({ maxSide: 480, quality: 0.72, outputType: "image/webp" });
    expect(mocks.upload.mock.calls.map(call => call[0])).toEqual(["owner/art.thumb.webp", "owner/art.flyer.webp"]);
    expect(url).toBe("/media/owner/art.flyer.webp");
    expect(flyerListingUrl(url)).toBe("/media/owner/art.thumb.webp");
  });
  it("does not publish a missing thumbnail", async () => {
    mocks.upload.mockResolvedValueOnce({ error: new Error("denied") });
    await expect(uploadFlyerImage(new File(["input"], "art.png"), "owner/art.png")).rejects.toThrow("denied");
    expect(mocks.upload).toHaveBeenCalledTimes(1);
  });
  it("keeps legacy artwork URLs unchanged", () => {
    expect(flyerListingUrl("/old-art.png")).toBe("/old-art.png");
    expect(flyerListingUrl(null)).toBeUndefined();
  });
  it.each(["art.jpeg", "art.JPG"])("pairs uncompressed %s artwork with its uploaded thumbnail", async (name) => {
    mocks.prepare.mockResolvedValue(new File(["official"], name, { type: "image/jpeg" }));
    const url = await uploadFlyerImage(new File(["input"], name), "owner/art.png");
    expect(flyerListingUrl(url)).toBe("/media/owner/art.thumb.webp");
    expect(mocks.upload.mock.calls[0]?.[0]).toBe("owner/art.thumb.webp");
  });
  it("retains signed query parameters and fragments on paired URLs", () => {
    expect(flyerListingUrl("/media/art.flyer.JPEG?token=test#image")).toBe("/media/art.thumb.webp?token=test#image");
    expect(flyerListingUrl("/media/art.flyer.png#image")).toBe("/media/art.thumb.webp#image");
  });
});