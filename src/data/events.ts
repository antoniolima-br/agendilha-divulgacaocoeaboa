import { usePublicEvents } from "./usePublicEvents";
import { addDaysToISO, saoPauloTodayISO } from "@/lib/eventDate";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleError } from "@/lib/error-handler";
import type { AgendaEvent } from "@/components/agenda/types";
import { qk } from "./queryKeys";
import { useCallback, useMemo } from "react";
import { eventDateISO, PUBLIC_EVENT_STATUSES } from "@/lib/eventDate";

export type Rating = { average: number; total: number };

export function normalizeEvents(value: unknown): AgendaEvent[] {
  if (Array.isArray(value)) return value as AgendaEvent[];

  if (value && typeof value === "object") {
    const nestedValue = value as { data?: unknown; events?: unknown };
    if (Array.isArray(nestedValue.events)) return nestedValue.events as AgendaEvent[];
    if (Array.isArray(nestedValue.data)) return nestedValue.data as AgendaEvent[];
  }

  return [];
}

/**
 * Unified hook for agenda events and related actions.
 * Replacing logic from useAgendaData.ts
 */
export function useEvents(options: { 
  enabled?: boolean; 
  staleTime?: number;
} = {}) {
  const qc = useQueryClient();

  const eventsQuery = usePublicEvents(options);

  const events = normalizeEvents(eventsQuery.data);

  const ratingIds = useMemo(() => events.map((event) => event.id).sort(), [events]);
  const ratingsQuery = useQuery({
    queryKey: [...qk.agenda.ratings(), ratingIds.join(",")],
    enabled: (options.enabled ?? true) && ratingIds.length > 0,
    queryFn: async (): Promise<Record<string, Rating>> => {
      const { data, error } = await supabase
        .from("event_ratings_summary")
        .select("event_id, average_rating, total_reviews")
        .in("event_id", ratingIds);
      if (error) throw error;

      return (data ?? []).reduce<Record<string, Rating>>((ratings, row) => {
        ratings[row.event_id] = { average: row.average_rating, total: row.total_reviews };
        return ratings;
      }, {});
    },
    staleTime: 5 * 60_000,
  });

  const trackView = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.rpc("increment_views", { event_id: id });
      if (error) throw error;
    } catch (error) {
      handleError(error, { silent: true, context: "trackView" });
    }
  }, []);

  const trackShare = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.rpc("increment_shares", { event_id: id });
      if (error) throw error;
    } catch (error) {
      handleError(error, { silent: true, context: "trackShare" });
    }
  }, []);

  return {
    events,
    ratings: ratingsQuery.data ?? {},
    isLoading: eventsQuery.isLoading || ratingsQuery.isLoading,
    isError: eventsQuery.isError || ratingsQuery.isError,
    trackView,
    trackShare,
    refetch: eventsQuery.refetch
  };
}
