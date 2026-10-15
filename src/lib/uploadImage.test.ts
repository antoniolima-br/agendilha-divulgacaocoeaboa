import { beforeEach, describe, expect, it, vi } from "vitest";
import { prepareUploadImage, isAnimatedWebp } from "./uploadImage";
import { compressImage } from "./mediaCompression";
vi.mock("./mediaCompression", () => ({ compressImage: vi.fn() }));

describe("upload compression adapter", () => {
  beforeEach(() => vi.clearAllMocks());
  it("preserves animated WebP instead of flattening the official artwork", async () => {
    const bytes = new Uint8Array(20);
    bytes.set([65, 78, 73, 77], 12);
    const file = new File([bytes], "animated.webp", { type: "image/webp" });
    Object.defineProperty(file, "arrayBuffer", { value: async () => bytes.buffer });
    expect(await isAnimatedWebp(file)).toBe(true);
    expect(await prepareUploadImage(file)).toBe(file);
    expect(compressImage).not.toHaveBeenCalled();
  });
  it.each(["image/gif", "image/svg+xml"])("preserves %s without flattening animation", async (type) => {
    const file = new File(["media"], "media", { type });
    expect(await prepareUploadImage(file)).toBe(file);
    expect(compressImage).not.toHaveBeenCalled();
  });
  it("returns the compressed file and releases the unused preview", async () => {
    const file = new File(["large"], "photo.jpg", { type: "image/jpeg" });
    const small = new File(["x"], "photo.jpg", { type: "image/jpeg" });
    const revoke = vi.fn();
    const originalRevoke = URL.revokeObjectURL;
    URL.revokeObjectURL = revoke;
    vi.mocked(compressImage).mockResolvedValue({ file: small, preview: "blob:preview", originalSize: 5, finalSize: 1, compressed: true, type: "image" });
    expect(await prepareUploadImage(file)).toBe(small);
    expect(revoke).toHaveBeenCalledWith("blob:preview");
    URL.revokeObjectURL = originalRevoke;
  });
});