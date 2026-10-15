import { describe, expect, it, vi } from "vitest";
import { flyerDataURL, readFlyerStream } from "./visionFlyer";
import { mapVisionFlyer, safeVisionPatch, visionFlyerSchema } from "../../supabase/functions/_shared/visionFlyer";
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: {} } }));
describe("vision flyer contract", () => {
  it("requires exactly the five requested JSON keys", () => {
    expect(Object.keys(visionFlyerSchema.properties)).toEqual(["titulo", "atrativo", "data", "horario", "local"]);
    expect(visionFlyerSchema.required).toEqual(["titulo", "atrativo", "data", "horario", "local"]);
    expect(visionFlyerSchema.additionalProperties).toBe(false);
  });
  it("maps the five fields and normalizes Brazilian dates", () => {
    expect(mapVisionFlyer({ titulo: "Samba da Ilha", atrativo: "Grupo da Praça", data: "24/10/2026", horario: "20:00", local: "Bar da Praça", status: "publicado" })).toEqual({ eventTitle: "Samba da Ilha", atrativoName: "Grupo da Praça", date: "2026-10-24", startTime: "20:00", locationName: "Bar da Praça" });
  });
  it("does not invent missing values or accept impossible dates/times", () => {
    expect(mapVisionFlyer({ titulo: null, atrativo: null, data: "2026-02-30", horario: "25:00", local: null })).toEqual({});
  });
  it("replaces only the untouched suggested date and empty fields", () => {
    expect(safeVisionPatch({ eventTitle: "Lido", date: "2026-10-24" }, { eventTitle: "", date: "2026-10-15" }, { eventTitle: "Manual", date: "2026-10-15" })).toEqual({ date: "2026-10-24" });
  });
  it("preserves chosen/restored date and linked identities", () => {
    expect(safeVisionPatch({ date: "2026-10-24", atrativoName: "Grupo", locationName: "Bar" }, { date: "2026-10-15" }, { date: "2026-10-15", estabelecimentoId: "venue", atrativoSourceId: "artist" }, new Set(["date"]))).toEqual({});
  });
  it("sends the actual image bytes with their MIME", async () => {
    expect(await flyerDataURL(new File([new Uint8Array([137,80,78,71])], "flyer.png", { type: "image/png" }), new AbortController().signal)).toBe("data:image/png;base64,iVBORw==");
  });
  it("parses fragmented streamed JSON only after completion", async () => {
    const text = JSON.stringify({ titulo: "Samba", atrativo: "Grupo", data: "2026-10-24", horario: "20:00", local: "Bar" });
    const body = `data: ${JSON.stringify({ type: "response.output_text.delta", delta: text })}\n\ndata: {"type":"response.completed"}\n\n`;
    const stream = new ReadableStream({ start(controller) { for (let i = 0; i < body.length; i += 7) controller.enqueue(new TextEncoder().encode(body.slice(i, i + 7))); controller.close(); } });
    expect(await readFlyerStream(new Response(stream))).toEqual({ eventTitle: "Samba", atrativoName: "Grupo", date: "2026-10-24", startTime: "20:00", locationName: "Bar" });
  });
  it("surfaces the safe credit error without retrying", async () => {
    await expect(readFlyerStream(new Response(JSON.stringify({ message: "Créditos insuficientes. Adicione créditos." }), { status: 402 }))).rejects.toMatchObject({ status: 402, message: "Créditos insuficientes. Adicione créditos." });
  });
  it("rejects incomplete/refused streams instead of applying partial data", async () => {
    await expect(readFlyerStream(new Response('data: {"type":"response.refusal.done","refusal":"Leitura recusada"}\n\n'))).rejects.toThrow("Leitura recusada");
    await expect(readFlyerStream(new Response('data: {"type":"response.output_text.delta","delta":"{}"}\n\n'))).rejects.toThrow("Não consegui concluir");
  });
});