import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type RegistrationCode = "DUPLICATE_EVENT" | "DUPLICATE_EVENT_START" | "FREE_DAILY_QUOTA";
export const registrationMessages: Record<RegistrationCode, string> = {
  DUPLICATE_EVENT: "Já existe um evento cadastrado com estes dados para este local e data (ativo ou em revisão pela curadoria). Por favor, verifique os horários se for uma nova atração.",
  DUPLICATE_EVENT_START: "Já existe um evento neste local, data e horário. Se for uma nova atração, escolha outro horário de início.",
  FREE_DAILY_QUOTA: "A cota gratuita deste estabelecimento ou atrativo já foi utilizada nesta data. Para divulgar outras atrações em horários diferentes, escolha Divulgação Patrocinada.",
};
export function registrationCode(error: unknown): RegistrationCode | null {
  const message = typeof error === "string" ? error : (error as { message?: string })?.message || "";
  return (["FREE_DAILY_QUOTA", "DUPLICATE_EVENT_START", "DUPLICATE_EVENT"] as const).find(code => message.includes(code)) || null;
}
export type RegistrationEvent = {
  date: string; start_time?: string | null; event_title?: string | null;
  atrativo_name?: string | null; location?: string | null;
  estabelecimento_id?: string | null; atrativo_id?: string | null; artist_id?: string | null;
  address_neighborhood?: string | null; image_url?: string | null; flyer_fingerprint?: string | null;
  promotion_choice: "free" | "highlight";
};
const normalize = (v?: string | null) => (v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
export function batchRegistrationIssue(events: RegistrationEvent[]): RegistrationCode | null {
  for (let i = 0; i < events.length; i++) {
    for (const previous of events.slice(0, i)) {
      const current = events[i];
      if (current.date !== previous.date) continue;
      const sameVenue = Boolean(current.estabelecimento_id && current.estabelecimento_id === previous.estabelecimento_id) || Boolean(normalize(current.location) && normalize(current.location) === normalize(previous.location));
      const sameAttraction = Boolean(normalize(current.atrativo_name) && normalize(current.atrativo_name) === normalize(previous.atrativo_name));
      if (sameVenue && current.start_time?.slice(0, 5) === previous.start_time?.slice(0, 5)) return "DUPLICATE_EVENT_START";
      if (current.promotion_choice === "free" && previous.promotion_choice === "free" && (sameVenue || sameAttraction)) return "FREE_DAILY_QUOTA";
    }
  }
  return null;
}
export async function checkEventRegistration(events: RegistrationEvent[]): Promise<RegistrationCode | null> {
  const local = batchRegistrationIssue(events);
  if (local) return local;
  const { data, error } = await supabase.rpc("check_event_registration", { p_events: events as unknown as Json });
  if (error) throw error;
  const code = (data as { code?: string } | null)?.code;
  return registrationCode(code || "");
}

/** Perceptual difference hash: tolerates resized/recompressed copies of a banner. */
export async function flyerFingerprint(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas"); canvas.width = 9; canvas.height = 8;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Não deu pra conferir o flyer. Tente enviar a imagem novamente.");
    ctx.drawImage(bitmap, 0, 0, 9, 8);
    const pixels = ctx.getImageData(0, 0, 9, 8).data;
    const gray = (i: number) => pixels[i * 4] * 0.299 + pixels[i * 4 + 1] * 0.587 + pixels[i * 4 + 2] * 0.114;
    let hash = "";
    for (let y = 0; y < 8; y++) {
      let byte = 0;
      for (let x = 0; x < 8; x++) byte = (byte << 1) | Number(gray(y * 9 + x) > gray(y * 9 + x + 1));
      hash += byte.toString(16).padStart(2, "0");
    }
    return hash;
  } finally { bitmap.close(); }
}