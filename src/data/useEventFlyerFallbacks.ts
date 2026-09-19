import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { addDaysToISO, eventDateISO, PUBLIC_EVENT_STATUSES, saoPauloTodayISO } from "@/lib/eventDate";

/** Flyers reais de eventos válidos, usados somente quando um patrocinador ainda não enviou sua capa. */
export function useEventFlyerFallbacks(limit = 6) {
  return useQuery({
    queryKey: ["event-flyer-fallbacks", limit, saoPauloTodayISO()],
    queryFn: async (): Promise<string[]> => {
      const today = saoPauloTodayISO();
      const { data, error } = await supabase
        .from("public_submissions")
        .select("id, date, image_url")
        .in("status", [...PUBLIC_EVENT_STATUSES])
        .not("image_url", "is", null)
        .gte("date", addDaysToISO(today, -1))
        .order("date", { ascending: true })
        .limit(40);

      if (error) throw error;

      return Array.from(
        new Set(
          (data ?? [])
            .filter((event) => eventDateISO(event.date) >= today)
            .map((event) => event.image_url?.trim())
            .filter((url): url is string => Boolean(url)),
        ),
      ).slice(0, limit);
    },
    staleTime: 5 * 60 * 1000,
  });
}