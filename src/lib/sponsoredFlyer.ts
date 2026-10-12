import { supabase } from "@/integrations/supabase/client";
import { generateFallbackFlyer, type FallbackFlyerData } from "./generateFallbackFlyer";

/** Prepare missing sponsored artwork before inserting any event in the batch. */
export async function prepareSponsoredFlyers(
  choice: string,
  events: { imageUrl?: string | null; data: FallbackFlyerData }[],
  upload: (data: FallbackFlyerData) => Promise<string>,
): Promise<(string | null)[]> {
  const urls: (string | null)[] = [];
  for (const event of events) {
    urls.push(event.imageUrl || (choice === "highlight" ? await upload(event.data) : null));
  }
  return urls;
}

export async function uploadSponsoredFlyer(data: FallbackFlyerData, userId: string): Promise<string> {
  if (!userId) throw new Error("Entre na sua conta para preparar o flyer.");
  const dataUrl = await generateFallbackFlyer(data);
  const blob = await (await fetch(dataUrl)).blob();
  const path = `${userId}/fallback-${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from("event-flyers").upload(path, blob, { contentType: "image/jpeg", upsert: false });
  if (error) throw new Error("Não deu pra preparar o flyer. Seu rascunho continua aqui; tente finalizar novamente.");
  return supabase.storage.from("event-flyers").getPublicUrl(path).data.publicUrl;
}