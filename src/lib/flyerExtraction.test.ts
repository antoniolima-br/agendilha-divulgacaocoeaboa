import { describe, expect, it, vi } from "vitest";
import { sanitizeFlyerFields, safeFlyerPatch, readFlyerStream, missingFlyerTitle, extractFlyer } from "./flyerExtraction";

vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getSession: async () => ({ data: { session: { access_token: "test-session" } } }) } } }));

describe("flyer extraction", () => {
  it("requires a manually supplied title after selecting a flyer, but allows titleless drafts without one", () => {
    expect(missingFlyerTitle(true, "")).toBe(true);
    expect(missingFlyerTitle(true, "  ")).toBe(true);
    expect(missingFlyerTitle(true, null)).toBe(true);
    expect(missingFlyerTitle(true, "Samba de Teste")).toBe(false);
    expect(missingFlyerTitle(false, "")).toBe(false);
  });
  it("sends the actual image bytes as a MIME-tagged base64 image", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('data: {"type":"response.output_text.delta","delta":"{\\"eventTitle\\":\\"Samba de Teste\\"}"}\n\ndata: {"type":"response.completed"}\n\n'));
    vi.stubGlobal("fetch", fetchMock);
    try {
      await expect(extractFlyer(new File(["flyer bytes"], "flyer.png", { type: "image/png" }), new AbortController().signal)).resolves.toEqual({ eventTitle: "Samba de Teste" });
      const request = fetchMock.mock.calls[0]?.[1];
      expect(JSON.parse(request.body)).toEqual({ image: "data:image/png;base64,Zmx5ZXIgYnl0ZXM=" });
      expect(request.headers.Authorization).toBe("Bearer test-session");
    } finally { vi.unstubAllGlobals(); }
  });
  it("allowlists content and rejects impossible dates and times", () => {
    expect(sanitizeFlyerFields({ eventTitle: " Samba ", date: "2026-02-30", startTime: "25:70", description: "a".repeat(600), status: "publicado", legalAcceptance: true })).toEqual({ eventTitle: "Samba", description: "a".repeat(500) });
    expect(sanitizeFlyerFields({ date: "2026-10-25", startTime: "20:30" })).toEqual({ date: "2026-10-25", startTime: "20:30" });
  });
  it("preserves edits, existing values and linked venue snapshots", () => {
    expect(safeFlyerPatch({ eventTitle: "Novo", date: "2026-10-25", locationName: "Bar" }, { eventTitle: "", date: "" }, { eventTitle: "Manual", date: "", estabelecimentoId: "linked" })).toEqual({ date: "2026-10-25" });
  });
  it("parses split SSE chunks and requires completed output", async () => {
    const chunks = ['data: {"type":"response.output_text.delta","delta":"{\\"eventTitle\\":\\"Sa', 'mba\\"}"}\n\n', 'data: {"type":"response.completed"}\n\n'];
    const stream = new ReadableStream({ start(controller) { chunks.forEach(chunk => controller.enqueue(new TextEncoder().encode(chunk))); controller.close(); } });
    await expect(readFlyerStream(new Response(stream))).resolves.toEqual({ eventTitle: "Samba" });
    await expect(readFlyerStream(new Response('data: {"type":"response.completed"}\n\n'))).rejects.toThrow("Não encontramos");
  });
  it("surfaces safe denial messages and terminal refusal", async () => {
    await expect(readFlyerStream(new Response(JSON.stringify({ error: { message: "Limite atingido" } }), { status: 403 }))).rejects.toThrow("Limite atingido");
    await expect(readFlyerStream(new Response('data: {"type":"response.refusal.done"}\n\n'))).rejects.toThrow("manualmente");
  });
});