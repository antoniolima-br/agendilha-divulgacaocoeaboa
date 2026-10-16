import { supabase } from "@/integrations/supabase/client";

/** Perfil de artista da própria conta (ou null se ainda não existir). */
export async function getOwnArtistProfile(userId: string) {
  const { data } = await supabase.from("artist_profiles").select("*").eq("user_id", userId).maybeSingle();
  return data;
}

/** Carrega um perfil de artista pelo id (o backend decide o que dá pra ver). */
export async function getArtistProfileById(id: string) {
  const { data, error } = await supabase.from("artist_profiles").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

/** Sugestões de artistas aprovados pelo nome. */
export async function searchPublicArtists(term: string) {
  const { data } = await supabase.from("public_artist_profiles").select("id, name, genre").ilike("name", `%${term}%`).limit(8);
  return data ?? [];
}

/** Salva o cadastro: atualiza o perfil existente ou cria o da própria conta. */
export async function saveArtistProfile(artistId: string | null, payload: Record<string, unknown>) {
  const query = artistId
    ? supabase.from("artist_profiles").update(payload as never).eq("id", artistId)
    : supabase.from("artist_profiles").upsert(payload as never, { onConflict: "user_id" });
  const { data, error } = await query.select("*").single();
  if (error) throw error;
  return data;
}
