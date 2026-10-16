import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleError } from "@/lib/error-handler";
import { qk } from "./queryKeys";

export interface NewsletterSubscriber {
  id: string;
  email: string;
  name: string | null;
  neighborhood: string | null;
  preferred_neighborhoods?: string[] | null;
  preferred_localities?: string[] | null;
  created_at: string;
  phone?: string | null;
  preferred_regions?: string[] | null;
  interest_event_id?: string | null;
  interest_status?: "interessado" | "confirmado" | "compareceu" | "cancelado";
}

/** Lista todos os inscritos da newsletter (admin only via RLS). */
export function useNewsletterSubscribers() {
  return useQuery({
    queryKey: qk.newsletter.list(),
    queryFn: async (): Promise<NewsletterSubscriber[]> => {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as NewsletterSubscriber[];
    },
    staleTime: 60_000,
    meta: {
      onError: (error: unknown) => handleError(error, { 
        fallback: "Não deu pra carregar os inscritos.",
        context: "useNewsletterSubscribers" 
      })
    }
  });
}

/** Contagem total de inscritos. */
export function useNewsletterCount() {
  return useQuery({
    queryKey: qk.newsletter.count(),
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from("newsletter_subscribers")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 60_000,
  });
}

/** Remove um inscrito por id e invalida o cache. */
export function useDeleteNewsletterSubscriber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: qk.newsletter.list() });
      const prev = qc.getQueryData<NewsletterSubscriber[]>(qk.newsletter.list());
      qc.setQueryData<NewsletterSubscriber[]>(qk.newsletter.list(), rows => rows?.filter(r => r.id !== id));
      return { prev };
    },
    onError: (_e, _id, ctx) => { if (ctx?.prev) qc.setQueryData(qk.newsletter.list(), ctx.prev); },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.newsletter.all });
      qc.invalidateQueries({ queryKey: ["crm"] });
    },
  });
}