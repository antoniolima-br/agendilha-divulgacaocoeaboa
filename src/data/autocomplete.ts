import { supabase } from "@/integrations/supabase/client";

export async function fetchAttractionSuggestions(query: string, from: number, to: number, signal: AbortSignal) {
  const { data, error } = await supabase.rpc("search_atrativos_autocomplete_v2", {
    _q: query || null, _limit: to - from + 1, _offset: from,
  }).abortSignal(signal);
  if (error) throw error;
  return data ?? [];
}

export async function fetchVenueSuggestions(query: string, from: number, to: number, signal: AbortSignal) {
  const { data, error } = await supabase.rpc("search_estabelecimentos_autocomplete", {
    _q: query || null, _limit: to - from + 1, _offset: from,
  }).abortSignal(signal);
  if (error) throw error;
  return data ?? [];
}