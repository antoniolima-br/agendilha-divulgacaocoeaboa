import { supabase } from "@/integrations/supabase/client";

/**
 * Grava a arte oficial de um rolê e devolve o image_url que ficou salvo
 * (null quando a linha não foi alterada). Quem chama decide se exige confirmação.
 */
export async function saveEventFlyerUrl(eventId: string, imageUrl: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("submissions")
    .update({ image_url: imageUrl })
    .eq("id", eventId)
    .select("id,image_url")
    .maybeSingle();
  if (error) throw error;
  return data?.image_url ?? null;
}
