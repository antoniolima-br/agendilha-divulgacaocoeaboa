import { describe, expect, it, vi, beforeEach } from "vitest";
import { prepareSponsoredFlyers, uploadSponsoredFlyer } from "./sponsoredFlyer";
const mocks = vi.hoisted(() => ({ upload: vi.fn(), generate: vi.fn() }));
vi.mock("./generateFallbackFlyer", () => ({ generateFallbackFlyer: mocks.generate }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { storage: { from: () => ({ upload: mocks.upload, getPublicUrl: (path: string) => ({ data: { publicUrl: `https://example.test/${path}` } }) }) } } }));
beforeEach(() => vi.clearAllMocks());
describe("sponsored artwork", () => {
  it("preserves uploaded art and leaves free events without automatic flyers", async () => {
    const upload = vi.fn();
    expect(await prepareSponsoredFlyers("free", [{ imageUrl: "existing", data: { title: "A" } }, { data: { title: "B" } }], upload)).toEqual(["existing", null]);
    expect(upload).not.toHaveBeenCalled();
  });
  it("generates separate sponsored artwork with each event's reviewed content", async () => {
    const upload = vi.fn(async (data) => `flyer-${data.title}`);
    const events = [{ imageUrl: "existing", data: { title: "A" } }, { data: { title: "B", date: "2026-10-25", startTime: "18:30", location: "Clube" } }];
    expect(await prepareSponsoredFlyers("highlight", events, upload)).toEqual(["existing", "flyer-B"]);
    expect(upload).toHaveBeenCalledWith(events[1].data);
  });
  it("rejects completion if any missing sponsored flyer cannot be prepared", async () => {
    const upload = vi.fn().mockResolvedValueOnce("flyer-A").mockRejectedValueOnce(new Error("Try again"));
    await expect(prepareSponsoredFlyers("highlight", [{ data: { title: "A" } }, { data: { title: "B" } }], upload)).rejects.toThrow("Try again");
  });
  it("requires an owner before artwork generation", async () => {
    await expect(uploadSponsoredFlyer({ title: "A" }, "")).rejects.toThrow("Entre na sua conta");
    expect(mocks.generate).not.toHaveBeenCalled();
  });
  it("uploads under the owner and returns a saved public URL", async () => {
    mocks.generate.mockResolvedValue("data:image/jpeg;base64,YQ==");
    mocks.upload.mockResolvedValue({ error: null });
    const url = await uploadSponsoredFlyer({ title: "A" }, "owner");
    expect(mocks.upload.mock.calls[0][0]).toMatch(/^owner\/fallback-.+\.jpg$/);
    expect(url).toContain("owner/fallback-");
  });
  it("never treats a failed image upload as success", async () => {
    mocks.generate.mockResolvedValue("data:image/jpeg;base64,YQ==");
    mocks.upload.mockResolvedValue({ error: { message: "Storage failed" } });
    await expect(uploadSponsoredFlyer({ title: "A" }, "owner")).rejects.toThrow("Seu rascunho continua aqui");
  });
});