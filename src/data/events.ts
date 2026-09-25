import { addDaysToISO, saoPauloTodayISO } from "@/lib/eventDate";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleError } from "@/lib/error-handler";
import type { AgendaEvent } from "@/components/agenda/types";
import { qk } from "./queryKeys";
import { useCallback } from "react";
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

  const eventsQuery = useQuery({
    queryKey: qk.agenda.events(),
    queryFn: async (): Promise<AgendaEvent[]> => {
      const { data, error } = await supabase
        .from("public_submissions")
        .select(`
          id, 
          event_title, 
          date, 
          start_time, 
          location, 
          address_neighborhood, 
          category, 
          image_url, 
          age_rating, 
          is_suitable_for_minors, 
          description, 
          views_count,
          is_highlight,
          status,
          moderation_status,
          slug
        `)
        .in("status", [...PUBLIC_EVENT_STATUSES])
        .or("moderation_status.is.null,moderation_status.neq.blocked")
        .gte("date", addDaysToISO(saoPauloTodayISO(), -1))
        .order("date", { ascending: true })
        .limit(1000);
      
      if (error) throw error;
      const events = normalizeEvents(data);

      if (import.meta.env.DEV) {
        if (events.length === 0) {
          console.info("[agenda] Nenhum evento público retornado pela consulta.");
        }

        const invalidDates = events
          .filter((event) => !eventDateISO(event.date))
          .map((event) => ({ id: event.id, date: event.date, status: event.status }));

        if (invalidDates.length > 0) {
          console.warn("[agenda] Eventos ignorados por data ausente ou inválida:", invalidDates);
        }
      }

      return events;
    },
    enabled: options.enabled,
    staleTime: options.staleTime ?? 60_000,
    meta: {
      onError: (error: unknown) =>
        handleError(error, "Não rolou carregar a agenda agora."),
    },
  });

  const events = normalizeEvents(eventsQuery.data);

  const ratingsQuery = useQuery({
    queryKey: [...qk.agenda.ratings(), events.map((event) => event.id)],
    enabled: (options.enabled ?? true) && events.length > 0,
    queryFn: async (): Promise<Record<string, Rating>> => {
      const eventIds = events.map((event) => event.id);
      if (eventIds.length === 0) return {};
      const { data, error } = await supabase
        .from("event_ratings_summary")
        .select("event_id, average_rating, total_reviews")
        .in("event_id", eventIds);
      if (error) throw error;
      
      const map: Record<string, Rating> = {};
      (data ?? []).forEach((r: any) => {
        map[r.event_id] = { average: r.average_rating, total: r.total_reviews };
      });
      return map;
    },
    staleTime: options.staleTime ?? 60_000,
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
