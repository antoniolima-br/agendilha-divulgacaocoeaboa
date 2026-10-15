import { supabase } from "@/integrations/supabase/client";
import { fetchAllPages } from "../pagination";
import { normalizeAds, type Ad } from "./model";

export const AD_COLUMNS =
  "id, user_id, title, description, category, price_cents, contact_whatsapp, city, neighborhood, photos, status, rejection_reason, is_highlight, highlight_plan_id, highlight_until, views_count, created_at, ad_type, event_date, event_location, product_id, destination_url, target_regions, ad_products(placement,is_active)";

export async function fetchPublishedAds({ signal }: { signal: AbortSignal }): Promise<Ad[]> {
  const expiresAfter = new Date().toISOString();
  const data = await fetchAllPages((from, to) => supabase
    .from("ads").select(AD_COLUMNS).eq("status", "publicado")
    .or(`highlight_until.is.null,highlight_until.gt.${expiresAfter}`)
    .order("is_highlight", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: true }).range(from, to).abortSignal(signal));
  return normalizeAds(data);
}

export async function fetchMyAds(userId: string | undefined): Promise<Ad[]> {
  if (!userId) return [];
  const { data, error } = await supabase.from("ads").select(AD_COLUMNS)
    .eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw error;
  return normalizeAds(data);
}

export async function fetchAllAds(): Promise<Ad[]> {
  const data = await fetchAllPages((from, to) => supabase.from("ads")
    .select(AD_COLUMNS).order("created_at", { ascending: false })
    .order("id", { ascending: true }).range(from, to));
  return normalizeAds(data);
}

export async function fetchAd(id: string | undefined): Promise<Ad | null> {
  if (!id) return null;
  const { data, error } = await supabase.from("ads").select(AD_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? normalizeAds([data])[0] ?? null : null;
}

export async function fetchPublishedFlyerAds(): Promise<Ad[]> {
  const since = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase.from("ads").select(AD_COLUMNS)
    .eq("status", "publicado").eq("ad_type", "flyer").is("product_id", null)
    .gte("event_date", since).order("event_date", { ascending: true }).limit(6);
  if (error) throw error;
  return normalizeAds(data).filter((ad) => ad.photos.length > 0);
}