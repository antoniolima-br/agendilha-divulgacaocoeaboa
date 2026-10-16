import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

/**
 * Camada única de envio de rolês novos.
 * Toda gravação de um evento recém-cadastrado passa por aqui: o lote de eventos,
 * os atrativos extras e o cadastro automático de local/atrativo novos.
 * Status, aprovação, cotas e duplicidade continuam garantidos pelo backend
 * (todo envio entra pendente e segue pra curadoria).
 */
type SubmissionInsert = Database["public"]["Tables"]["submissions"]["Insert"];
type SubmissionAtrativoInsert = Database["public"]["Tables"]["submission_atrativos"]["Insert"];
type EstabelecimentoInsert = Database["public"]["Tables"]["estabelecimentos"]["Insert"];
type AtrativoInsert = Database["public"]["Tables"]["atrativos"]["Insert"];

/** Grava todos os eventos do envio de uma vez só e confirma que nenhum ficou de fora. */
export async function insertEventBatch(userId: string, rows: Omit<SubmissionInsert, "user_id">[]): Promise<{ id: string }[]> {
  const { data, error } = await supabase
    .from("submissions")
    .insert(rows.map((row) => ({ ...row, user_id: userId })))
    .select("id");
  if (error) throw error;
  if (!data || data.length !== rows.length) {
    throw new Error("Não deu pra confirmar o envio. Confira seus eventos antes de tentar novamente.");
  }
  return data as { id: string }[];
}

/** Atrativos do evento (principal + extras incluídos no formulário). */
export async function insertSubmissionAttractions(rows: SubmissionAtrativoInsert[]): Promise<void> {
  if (!rows.length) return;
  const { error } = await supabase.from("submission_atrativos").insert(rows);
  if (error) throw error;
}

/** Cria o local digitado pela primeira vez e liga aos eventos do envio. Devolve o id ou null. */
export async function createVenueForSubmissions(
  venue: Omit<EstabelecimentoInsert, "listing_kind">,
  submissionIds: string[],
): Promise<string | null> {
  const { data } = await supabase
    .from("estabelecimentos")
    .insert({ ...venue, listing_kind: "event_venue" })
    .select("id")
    .maybeSingle();
  if (!data?.id) return null;
  await supabase.from("submissions").update({ estabelecimento_id: data.id }).in("id", submissionIds);
  return data.id;
}

/** Cria o atrativo digitado pela primeira vez, pra aparecer nas próximas sugestões. */
export async function createAttractionFromSubmission(attraction: AtrativoInsert): Promise<void> {
  await supabase.from("atrativos").insert(attraction);
}
