import { parseFlyerText } from "./flyerText";
import { sanitizeFlyerFields, type FlyerFields } from "../../supabase/functions/_shared/flyerFields";
export { sanitizeFlyerFields, type FlyerFields };

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
    const { data } = await new Promise<Awaited<ReturnType<typeof worker.recognize>>>((resolve, reject) => {
      const stop = () => reject(cancelled());
      signal.addEventListener("abort", stop, { once: true });
      worker.recognize(file).then(resolve, reject).finally(() => signal.removeEventListener("abort", stop));
    });
    if (signal.aborted) throw cancelled();
    onProgress?.(100);
    return parseFlyerText(data.text);
  } finally {
    signal.removeEventListener("abort", abort);
    await worker.terminate().catch(() => {});
  }
}
