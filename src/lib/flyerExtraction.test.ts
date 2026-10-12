import { describe, expect, it } from "vitest";
import { sanitizeFlyerFields, safeFlyerPatch, readFlyerStream } from "./flyerExtraction";

describe("flyer extraction", () => {
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