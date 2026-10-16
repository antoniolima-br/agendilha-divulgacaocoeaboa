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

/** Tira um destaque pago do ar (usado quando o pagamento é cancelado). */
export async function hidePaidHighlight(eventId: string): Promise<void> {
  const { error } = await supabase
    .from("submissions")
    .update({ is_highlight: false, highlight_hidden: true })
    .eq("id", eventId);
  if (error) throw error;
}

/** Edição rápida do painel: grava os campos já montados pela tela. */
export async function updateEventFields(eventId: string, payload: Record<string, string | boolean | null>): Promise<void> {
  const { error } = await supabase.from("submissions").update(payload as never).eq("id", eventId);
  if (error) throw error;
}
