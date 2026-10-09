import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { qk } from "./queryKeys";
import { PUBLIC_EVENT_STATUSES, isCurrentOrFutureEventDate, saoPauloTodayISO } from "@/lib/eventDate";
import type { AgendaEvent } from "@/components/agenda/types";
export function usePublicEvents(options: { enabled?: boolean; staleTime?: number } = {}) {
  return useQuery({
    queryKey: qk.agenda.events(),
    queryFn: async (): Promise<AgendaEvent[]> => {
      const { data, error } = await supabase.from("public_submissions")
        .select("id, event_title, date, start_time, end_time, location, address_street, address_neighborhood, address_city, category, image_url, age_rating, is_suitable_for_minors, description, views_count, is_highlight, highlight_active, highlight_hidden, highlight_until, is_free, status, slug, atrativo_style")
        .in("status", [...PUBLIC_EVENT_STATUSES]).or("moderation_status.is.null,moderation_status.neq.blocked").eq("is_archived", false).gte("event_day", saoPauloTodayISO())
        .order("date", { ascending: true }).order("start_time", { ascending: true, nullsFirst: false }).limit(1000);
      if (error) throw error;
      return (data ?? []).filter((event) => isCurrentOrFutureEventDate(event.date)) as AgendaEvent[];
    }, enabled: options.enabled, staleTime: options.staleTime ?? 60_000,
  });
}
