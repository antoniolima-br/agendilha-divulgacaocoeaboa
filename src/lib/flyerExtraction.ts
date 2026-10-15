import { parseFlyerText } from "./flyerText";
import { sanitizeFlyerFields, type FlyerFields } from "../../supabase/functions/_shared/flyerFields";
export { sanitizeFlyerFields, type FlyerFields };

export function missingFlyerTitle(hasFlyer: boolean, title: unknown): boolean {
  return hasFlyer && !(typeof title === "string" && title.trim());
}

export function safeFlyerPatch(extracted: FlyerFields, before: Record<string, unknown>, current: Record<string, unknown>): FlyerFields {
  const patch: FlyerFields = {};
  for (const key of Object.keys(extracted) as (keyof FlyerFields)[]) {
    // Never replace manual edits or an existing value; venue links retain their snapshot.
    if (current[key] !== before[key] || current[key]) continue;
    if ((key === "locationName" || key === "eventAddress" || key.startsWith("address")) && current.estabelecimentoId) continue;
    patch[key] = extracted[key];
  }
  return patch;
}

export async function readFlyerStream(response: Response): Promise<FlyerFields> {
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = payload.message || payload.error?.message || (typeof payload.error === "string" ? payload.error : null);
    throw new Error(message || "Não deu pra ler o flyer. Preencha manualmente por enquanto.");
  }
  if (!response.body) throw new Error("A leitura não retornou dados. Preencha manualmente.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "", text = "", completed = false;
  const event = (block: string) => {
    const raw = block.split("\n").filter(line => line.startsWith("data:")).map(line => line.slice(5).trim()).join("\n");
    if (!raw || raw === "[DONE]") return;
    const data = JSON.parse(raw);
    if (data.type === "response.output_text.delta") text += data.delta || "";
    if (data.type === "response.refusal.delta" || data.type === "response.refusal.done") throw new Error("Não foi possível ler esse conteúdo. Preencha os dados manualmente.");
    if (["error", "response.failed", "response.incomplete"].includes(data.type)) throw new Error(data.error?.message || data.response?.error?.message || "A leitura não foi concluída. Preencha manualmente.");
    if (data.type === "response.completed") completed = true;
  };
  try {
    while (true) {
      const chunk = await reader.read();
      buffer += decoder.decode(chunk.value, { stream: !chunk.done });
      // Normalize after joining chunks: CR and LF may arrive in separate reads.
      buffer = buffer.replace(/\r\n/g, "\n");
      let boundary: number;
      while ((boundary = buffer.indexOf("\n\n")) >= 0) { event(buffer.slice(0, boundary)); buffer = buffer.slice(boundary + 2); }
      if (chunk.done) break;
    }
    if (buffer.trim()) event(buffer);
    if (!completed || !text.trim()) throw new Error("Não encontramos dados legíveis. Preencha manualmente ou envie uma imagem mais nítida.");
    return sanitizeFlyerFields(JSON.parse(text));
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}

export async function extractFlyer(file: File, signal: AbortSignal, onProgress?: (progress: number) => void): Promise<FlyerFields> {
  const cancelled = () => new DOMException("Cancelado", "AbortError");
  if (signal.aborted) throw cancelled();
  // Loaded only on image selection. Image processing stays in the browser.
  const { createWorker } = await import("tesseract.js");
  if (signal.aborted) throw cancelled();
  const worker = await createWorker("por", 1, {
    logger: ({ status, progress }) => {
      if (!signal.aborted) onProgress?.(status === "recognizing text" ? Math.round(progress * 100) : 0);
    },
  });
  const abort = () => { void worker.terminate().catch(() => {}); };
  signal.addEventListener("abort", abort, { once: true });
  try {
    if (signal.aborted) throw cancelled();
    const { data } = await worker.recognize(file);
    if (signal.aborted) throw cancelled();
    onProgress?.(100);
    return parseFlyerText(data.text);
  } finally {
    signal.removeEventListener("abort", abort);
    await worker.terminate().catch(() => {});
  }
}
