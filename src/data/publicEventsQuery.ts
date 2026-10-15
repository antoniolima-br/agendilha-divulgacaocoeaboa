import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PUBLIC_EVENT_STATUSES, eventDateISO, saoPauloTodayISO } from "@/lib/eventDate";
import type { AgendaEvent } from "@/components/agenda/types";
import { qk } from "./queryKeys";

/** The same public-only request backs navigation prefetch and mounted pages. */
export function publicEventsQueryOptions(staleTime = 60_000) {
  return queryOptions({
    queryKey: qk.agenda.events(),
    staleTime,
    queryFn: async ({ signal }): Promise<AgendaEvent[]> => {
      const today = saoPauloTodayISO();
      const { data, error } = await supabase.from("public_submissions")
        .select("id, event_title, date, start_time, end_time, location, address_street, address_neighborhood, address_city, category, image_url, age_rating, is_suitable_for_minors, description, views_count, is_highlight, highlight_active, highlight_hidden, highlight_until, is_free, status, slug, atrativo_style")
        .in("status", [...PUBLIC_EVENT_STATUSES])
        .or("moderation_status.is.null,moderation_status.neq.blocked")
        .eq("is_archived", false).gte("event_day", today)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true, nullsFirst: false })
        .order("id", { ascending: true }).range(0, 14).abortSignal(signal);
      if (error) throw error;
      return (data ?? []).filter((event) => {
        const day = eventDateISO(event.date);
        return day !== "" && day >= today;
      }) as AgendaEvent[];
    },
  });
}