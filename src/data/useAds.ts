import { useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { qk } from "@/data/queryKeys";
import { usePublicAdsRefresh } from "./publicAdsRefresh";
import { matchesAdAudience, matchesAnyAdAudience, type AdPlacement } from "@/lib/advertising";
import { normalizeAds, type Ad, type AdInput, type AdStatus } from "./ads/model";
import { AD_COLUMNS, fetchPublishedAds, fetchMyAds, fetchAllAds, fetchAd, fetchPublishedFlyerAds } from "./ads/queries";

export { AD_CATEGORIES, normalizeAds } from "./ads/model";
export type { Ad, AdInput, AdStatus } from "./ads/model";

export const ADS_KEY = qk.ads.all;

/** Anúncios publicados (vitrine pública). */
export function usePublishedAds(region = "all", placement?: AdPlacement) {
  usePublicAdsRefresh();
  const select = useCallback((ads: Ad[]) => ads.filter((ad) => matchesAdAudience(ad, region, placement)), [region, placement]);
  return useQuery({
    queryKey: qk.ads.published(),
    queryFn: fetchPublishedAds,
    staleTime: 60 * 1000,
    select,
  });
}

/** Anúncios publicados compatíveis com uma ou mais regiões do Radar. */
export function usePublishedRadarAds(regions: readonly string[]) {
  usePublicAdsRefresh();
  const select = useCallback((ads: Ad[]) => ads.filter((ad) => matchesAnyAdAudience(ad, regions, "agenda_card")), [regions]);
  return useQuery({
    queryKey: qk.ads.published(),
    queryFn: fetchPublishedAds,
    staleTime: 60 * 1000,
    select,
  });
}

/** Anúncios do usuário logado. */
export function useMyAds(userId: string | undefined) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: qk.ads.mine(userId),
    enabled: !!userId,
    queryFn: () => fetchMyAds(userId),
  });

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`my-ads:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ads",
          filter: `user_id=eq.${userId}`,
        },
        () => void qc.invalidateQueries({ queryKey: qk.ads.mine(userId) }),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc, userId]);

  return query;
}

/** Todos os anúncios — usado na tela de moderação (RLS libera só para a equipe). */
export function useAllAds(enabled: boolean) {
  return useQuery({
    queryKey: qk.ads.list(),
    enabled,
    queryFn: fetchAllAds,
  });
}

/** Um anúncio pelo id. */
export function useAd(id: string | undefined) {
  return useQuery({
    queryKey: qk.ads.byId(id),
    enabled: !!id,
    queryFn: () => fetchAd(id),
  });
}

/** Cria um anúncio (entra em análise). */
export function useCreateAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, input }: { userId: string; input: AdInput }): Promise<Ad> => {
      const { data, error } = await supabase
        .from("ads")
        .insert({ ...input, user_id: userId })
        .select(AD_COLUMNS)
        .single();
      if (error) throw error;
      const created = normalizeAds([data])[0];
      if (!created) throw new Error("O anúncio salvo voltou com dados inválidos.");
      return created;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ADS_KEY }),
  });
}

/** Atualiza um anúncio do próprio autor. */
export function useUpdateAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<AdInput> }) => {
      const { error } = await supabase.from("ads").update(input).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ADS_KEY }),
  });
}

/** Moderação: aprovar, recusar e ligar/desligar destaque (somente equipe, via RLS). */
export function useModerateAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: {
        status?: AdStatus;
        rejection_reason?: string | null;
        is_highlight?: boolean;
        highlight_plan_id?: string | null;
        highlight_until?: string | null;
        published_at?: string | null;
        product_id?: string | null;
        destination_url?: string | null;
        target_regions?: string[];
      };
    }) => {
      const { data, error } = await supabase.from("ads").update(patch).eq("id", id).select(AD_COLUMNS).single();
      if (error) throw error;
      const saved = normalizeAds([data])[0];
      if (!saved || Object.entries(patch).some(([key, value]) => {
        if (!(key in saved)) return false;
        const actual = saved[key as keyof Ad];
        if (key === "highlight_until" && typeof value === "string" && typeof actual === "string") return Date.parse(value) !== Date.parse(actual);
        if (Array.isArray(value) && Array.isArray(actual)) return [...value].sort().join("|") !== [...actual].sort().join("|");
        return JSON.stringify(actual) !== JSON.stringify(value);
      })) throw new Error("A alteração não foi confirmada. Confira seu acesso e tente de novo.");
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ADS_KEY }),
  });
}

/** Remove um anúncio. */
export function useDeleteAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ADS_KEY }),
  });
}

/** Flyers publicados com data futura — entram no carrossel principal da Home. */
export function usePublishedFlyerAds() {
  return useQuery({
    queryKey: qk.ads.flyersHome(),
    queryFn: fetchPublishedFlyerAds,
    staleTime: 60 * 1000,
  });
}
