import { supabase } from "@/integrations/supabase/client";
import { EdgeFunctionError } from "./edge";
import { mapVisionFlyer } from "../../supabase/functions/_shared/visionFlyer";
export { safeVisionPatch, type VisionFlyerFields } from "../../supabase/functions/_shared/visionFlyer";

export function flyerDataURL(file: File, signal: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const abort = () => { reader.abort(); reject(new DOMException("Cancelado", "AbortError")); };
    if (signal.aborted) { abort(); return; }
    signal.addEventListener("abort", abort, { once: true });
    const clean = () => signal.removeEventListener("abort", abort);
    reader.onload = () => { clean(); typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Escolha outro flyer.")); };
    reader.onerror = () => { clean(); reject(new Error("Não consegui abrir esse flyer. Escolha outra imagem.")); };
    reader.readAsDataURL(file);
  });
}

export async function readFlyerStream(response: Response) {
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new EdgeFunctionError(payload.message || payload.error?.message || "Não consegui ler o flyer. Preencha os dados manualmente.", response.status);
  }
  if (!response.body) throw new Error("Não recebi os dados do flyer. Preencha manualmente.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "", text = "", completed = false;
  const process = (frame: string) => {
    const data = frame.split("\n").filter(line => line.startsWith("data:")).map(line => line.slice(5).trim()).join("\n");
    if (!data || data === "[DONE]") return;
    const event = JSON.parse(data);
    if (event.type === "error" || event.type === "response.failed" || event.type === "response.incomplete") throw new Error(event.message || event.error?.message || event.response?.error?.message || "Não consegui concluir a leitura. Preencha os dados manualmente.");
    if (event.type === "response.refusal.delta" || event.type === "response.refusal.done") throw new Error(event.refusal || event.delta || "Não consegui ler esse flyer. Preencha os dados manualmente.");
    if (event.type === "response.output_text.delta") text += event.delta;
    if (event.type === "response.completed") completed = true;
  };
  try {
    while (true) {
      const chunk = await reader.read();
      buffer += decoder.decode(chunk.value, { stream: !chunk.done }).replace(/\r\n/g, "\n");
      let end = buffer.indexOf("\n\n");
      while (end >= 0) { process(buffer.slice(0, end)); buffer = buffer.slice(end + 2); end = buffer.indexOf("\n\n"); }
      if (chunk.done) break;
    }
    if (buffer.trim()) process(buffer);
    if (!completed || !text.trim()) throw new Error("Não consegui concluir a leitura. Preencha os dados manualmente.");
    return mapVisionFlyer(JSON.parse(text));
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}

export async function extractVisionFlyer(file: File, signal: AbortSignal) {
  const image = await flyerDataURL(file, signal);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Entre na sua conta para eu ler o flyer.");
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-flyer`, {
    method: "POST", signal,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
    body: JSON.stringify({ image }),
  });
  return readFlyerStream(response);
}