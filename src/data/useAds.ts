import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AdStatus = "pendente" | "publicado" | "recusado";

export interface Ad {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  price_cents: number | null;
  contact_whatsapp: string;
  city: string | null;
  neighborhood: string | null;
  photos: string[];
  status: AdStatus;
  rejection_reason: string | null;
  is_highlight: boolean;
  highlight_plan_id: string | null;
  highlight_until: string | null;
  views_count: number;
  created_at: string;
  ad_type: string;
  event_date: string | null;
  event_location: string | null;
}

export const AD_CATEGORIES = [
  "Produtos",
  "Serviços",
  "Espaço para eventos",
  "Equipamentos",
  "Alimentos e bebidas",
  "Artesanato",
  "Vagas e freelas",
  "Outros",
] as const;

const AD_COLUMNS =
  "id, user_id, title, description, category, price_cents, contact_whatsapp, city, neighborhood, photos, status, rejection_reason, is_highlight, highlight_plan_id, highlight_until, views_count, created_at, ad_type, event_date, event_location";

export const ADS_KEY = ["ads"] as const;

/** Anúncios publicados (vitrine pública). */
export function usePublishedAds() {
  return useQuery({
    queryKey: [...ADS_KEY, "publicados"],
    queryFn: async (): Promise<Ad[]> => {
      const { data, error } = await supabase
        .from("ads")
        .select(AD_COLUMNS)
        .eq("status", "publicado")
        .or(`highlight_until.is.null,highlight_until.gt.${new Date().toISOString()}`)
        .order("is_highlight", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return normalizeAds(data);
    },
    staleTime: 60 * 1000,
  });
}

/** Anúncios do usuário logado. */
export function useMyAds(userId: string | undefined) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: [...ADS_KEY, "meus", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Ad[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("ads")
        .select(AD_COLUMNS)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return normalizeAds(data);
    },
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
        () => void qc.invalidateQueries({ queryKey: [...ADS_KEY, "meus", userId] }),
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
    queryKey: [...ADS_KEY, "todos"],
    enabled,
    queryFn: async (): Promise<Ad[]> => {
      const { data, error } = await supabase
        .from("ads")
        .select(AD_COLUMNS)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return normalizeAds(data);
    },
  });
}

/** Um anúncio pelo id. */
export function useAd(id: string | undefined) {
  return useQuery({
    queryKey: [...ADS_KEY, "detalhe", id],
    enabled: !!id,
    queryFn: async (): Promise<Ad | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("ads")
        .select(AD_COLUMNS)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? normalizeAds([data])[0] ?? null : null;
    },
  });
}

export interface AdInput {
  title: string;
  description: string;
  category: string;
  price_cents: number | null;
  contact_whatsapp: string;
  city: string | null;
  neighborhood: string | null;
  photos: string[];
  ad_type?: string;
  event_date?: string | null;
  event_location?: string | null;
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
      };
    }) => {
      const { error } = await supabase.from("ads").update(patch).eq("id", id);
      if (error) throw error;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isAdStatus(value: unknown): value is AdStatus {
  return value === "pendente" || value === "publicado" || value === "recusado";
}

/** Normaliza respostas e caches antes de qualquer lista de anúncios ser renderizada. */
export function normalizeAds(rows: unknown): Ad[] {
  if (!Array.isArray(rows)) return [];

  return rows
    .filter(isRecord)
    .filter((row) =>
      typeof row.id === "string" &&
      typeof row.user_id === "string" &&
      typeof row.title === "string" &&
      typeof row.description === "string" &&
      typeof row.category === "string" &&
      typeof row.contact_whatsapp === "string" &&
      isAdStatus(row.status),
    )
    .map((row): Ad => ({
      id: row.id as string,
      user_id: row.user_id as string,
      title: row.title as string,
      description: row.description as string,
      category: row.category as string,
      contact_whatsapp: row.contact_whatsapp as string,
      status: row.status as AdStatus,
      price_cents: typeof row.price_cents === "number" && Number.isFinite(row.price_cents) ? row.price_cents : null,
      city: typeof row.city === "string" ? row.city : null,
      neighborhood: typeof row.neighborhood === "string" ? row.neighborhood : null,
      photos: Array.isArray(row.photos)
        ? row.photos.filter((photo): photo is string => typeof photo === "string" && photo.trim().length > 0)
        : [],
      rejection_reason: typeof row.rejection_reason === "string" ? row.rejection_reason : null,
      is_highlight: row.is_highlight === true,
      highlight_plan_id: typeof row.highlight_plan_id === "string" ? row.highlight_plan_id : null,
      highlight_until: typeof row.highlight_until === "string" ? row.highlight_until : null,
      views_count: typeof row.views_count === "number" && Number.isFinite(row.views_count) ? row.views_count : 0,
      created_at: typeof row.created_at === "string" ? row.created_at : "",
      ad_type: typeof row.ad_type === "string" ? row.ad_type : "gratuito",
      event_date: typeof row.event_date === "string" ? row.event_date : null,
      event_location: typeof row.event_location === "string" ? row.event_location : null,
    }));
}

/** Flyers publicados com data futura — entram no carrossel principal da Home. */
export function usePublishedFlyerAds() {
  return useQuery({
    queryKey: [...ADS_KEY, "flyers-home"],
    queryFn: async (): Promise<Ad[]> => {
      const since = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("ads")
        .select(AD_COLUMNS)
        .eq("status", "publicado")
        .eq("ad_type", "flyer")
        .gte("event_date", since)
        .order("event_date", { ascending: true })
        .limit(6);
      if (error) throw error;
      return normalizeAds(data).filter((ad) => ad.photos.length > 0);
    },
    staleTime: 60 * 1000,
  });
}
