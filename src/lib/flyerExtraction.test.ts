import { beforeEach, describe, expect, it, vi } from "vitest";
import { sanitizeFlyerFields, safeFlyerPatch, extractFlyer } from "./flyerExtraction";
const mocks = vi.hoisted(() => ({ recognize: vi.fn(), terminate: vi.fn(), create: vi.fn() }));
vi.mock("tesseract.js", () => ({ createWorker: mocks.create }));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.terminate.mockResolvedValue(undefined);
  mocks.create.mockResolvedValue({ recognize: mocks.recognize, terminate: mocks.terminate });
});
describe("local flyer extraction", () => {
  it("passes actual image directly to Portuguese OCR without cloud requests", async () => {
    mocks.recognize.mockResolvedValue({ data: { text: "SAMBA DA ILHA\n25/10/2026\n22h\nLocal: Bar da Praça" } });
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    try {
      const file = new File(["image"], "flyer.png", { type: "image/png" });
      const progress = vi.fn();
      expect(await extractFlyer(file, new AbortController().signal, progress)).toEqual({ eventTitle: "SAMBA DA ILHA", date: "2026-10-25", startTime: "22:00", locationName: "Bar da Praça" });
      expect(mocks.recognize).toHaveBeenCalledWith(file);
      expect(mocks.create).toHaveBeenCalledWith("por", 1, expect.objectContaining({ logger: expect.any(Function) }));
      expect(fetchMock).not.toHaveBeenCalled();
      expect(progress).toHaveBeenLastCalledWith(100);
      expect(mocks.terminate).toHaveBeenCalledOnce();
    } finally { vi.unstubAllGlobals(); }
  });
  it("releases OCR worker after reading failure", async () => {
    mocks.recognize.mockRejectedValue(new Error("OCR failed"));
    await expect(extractFlyer(new File(["image"], "flyer.png"), new AbortController().signal)).rejects.toThrow("OCR failed");
    expect(mocks.terminate).toHaveBeenCalledOnce();
  });
  it("cancels an active OCR and terminates its worker", async () => {
    mocks.recognize.mockImplementation(() => new Promise(() => {}));
    const controller = new AbortController();
    const reading = extractFlyer(new File(["image"], "flyer.png"), controller.signal);
    const rejected = expect(reading).rejects.toMatchObject({ name: "AbortError" });
    await vi.waitFor(() => expect(mocks.recognize).toHaveBeenCalled());
    controller.abort(); await rejected;
    expect(mocks.terminate).toHaveBeenCalled();
  });
  it("does not start OCR for an aborted selection", async () => {
    const controller = new AbortController(); controller.abort();
    await expect(extractFlyer(new File(["image"], "flyer.png"), controller.signal)).rejects.toMatchObject({ name: "AbortError" });
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("allowlists content and rejects impossible dates and times", () => {
    expect(sanitizeFlyerFields({ eventTitle: " Samba ", date: "2026-02-30", startTime: "25:70", status: "publicado" })).toEqual({ eventTitle: "Samba" });
  });
  it("preserves edits, existing values and linked venue snapshots", () => {
    expect(safeFlyerPatch({ eventTitle: "Novo", date: "2026-10-25", locationName: "Bar" }, { eventTitle: "", date: "" }, { eventTitle: "Manual", date: "", estabelecimentoId: "linked" })).toEqual({ date: "2026-10-25" });
  });
});
