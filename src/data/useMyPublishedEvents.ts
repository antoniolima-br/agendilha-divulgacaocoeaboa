import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { qk } from "./queryKeys";
import { PUBLIC_EVENT_STATUSES, saoPauloTodayISO } from "@/lib/eventDate";
import { eligiblePromoterEvents, type PromoterShareEvent } from "@/lib/promoterEventSharing";

export function useMyPublishedEvents() {
  const { user } = useAuth();
  const ownerId = user?.id;
  const today = saoPauloTodayISO();
  return useQuery({
    queryKey: qk.submissions.minePublished(ownerId, today),
    enabled: !!ownerId,
    staleTime: 30_000,
    queryFn: async () => {
      if (!ownerId) return [];
      const events: PromoterShareEvent[] = [];
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await supabase.from("public_submissions")
          .select("id, user_id, slug, event_title, date, start_time, location, address_street, address_neighborhood, description, image_url, status")
          .eq("user_id", ownerId).in("status", [...PUBLIC_EVENT_STATUSES])
          .eq("is_archived", false).or("moderation_status.is.null,moderation_status.neq.blocked")
          .gte("event_day", today).order("date").order("id").range(offset, offset + 499);
        if (error) throw error;
        events.push(...((data ?? []) as PromoterShareEvent[]));
        if (!data || data.length < 500) return eligiblePromoterEvents(events, ownerId, today);
      }
    },
  });
}