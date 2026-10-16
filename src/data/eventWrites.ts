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

/** Muda a etapa de moderação de um rolê no painel de eventos. */
export async function setEventModeration(eventId: string, moderationStatus: string): Promise<void> {
  const { error } = await supabase.from("submissions").update({ moderation_status: moderationStatus }).eq("id", eventId);
  if (error) throw error;
}

/** Liga ou desliga o destaque da Home, gravando o tipo (cortesia/pago) e a arte usada. */
export async function setEventHighlight(
  eventId: string,
  highlight: { isHighlight: boolean; imageUrl: string | null; grantType: "courtesy" | "paid" | null },
): Promise<void> {
  const { error } = await supabase
    .from("submissions")
    .update({ is_highlight: highlight.isHighlight, highlight_hidden: false, image_url: highlight.imageUrl, highlight_grant_type: highlight.grantType })
    .eq("id", eventId);
  if (error) throw error;
}

/** Remove um rolê pelo painel de eventos (o backend confere quem pode). */
export async function deleteEvent(eventId: string): Promise<void> {
  const { error } = await supabase.from("submissions").delete().eq("id", eventId);
  if (error) throw error;
}

/** Aprova ou rejeita um rolê, gravando quem decidiu, quando e a observação. */
export async function setEventReviewStatus(
  eventId: string,
  decision: { kind: "approved" | "rejected"; reviewerId: string | undefined; notes: string | null },
): Promise<void> {
  const now = new Date().toISOString();
  const payload = decision.kind === "approved"
    ? { status: "aprovado", approved_at: now, approved_by: decision.reviewerId, rejected_at: null, rejected_by: null, admin_notes: decision.notes }
    : { status: "rejeitado", rejected_at: now, rejected_by: decision.reviewerId, admin_notes: decision.notes };
  const { error } = await supabase.from("submissions").update(payload as never).eq("id", eventId);
  if (error) throw error;
}

/** Sobe um flyer automático (gerado no navegador) e devolve o link público da arte. */
export async function uploadFallbackFlyer(ownerId: string | undefined, eventId: string, dataUrl: string): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob();
  const filePath = `${ownerId ?? "admin"}/fallback-${eventId}-${Date.now()}.jpg`;
  const { error } = await supabase.storage.from("event-flyers").upload(filePath, blob, { contentType: "image/jpeg", upsert: true });
  if (error) throw error;
  return supabase.storage.from("event-flyers").getPublicUrl(filePath).data.publicUrl;
}

/** Grava a arte no rolê sem exigir confirmação da linha alterada. */
export async function setEventImageUrl(eventId: string, imageUrl: string): Promise<void> {
  const { error } = await supabase.from("submissions").update({ image_url: imageUrl }).eq("id", eventId);
  if (error) throw error;
}

/** Lista completa do painel de eventos, do mais novo pro mais antigo. */
export async function listAdminEvents() {
  const { data, error } = await supabase.from("submissions").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Rolês cuja arte atual é um flyer automático. */
export async function listAutoFlyerEvents() {
  const { data, error } = await supabase
    .from("submissions")
    .select("id, event_title, atrativo_name, company_name, date, start_time, location, category, image_url")
    .like("image_url", "%/fallback-%");
  if (error) throw error;
  return data ?? [];
}
