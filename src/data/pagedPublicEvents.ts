import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AgendaEvent } from "@/components/agenda/types";
import { PUBLIC_EVENT_STATUSES, saoPauloTodayISO } from "@/lib/eventDate";
import { fetchAllPages } from "./pagination";
import { qk } from "./queryKeys";
import { usePublicEventsRealtime } from "./publicEventsRealtime";

export const EVENT_BATCH_SIZE = 15;
export function eventBatchIds(events: readonly { id: string }[], page: number): string[] {
  return events.slice(page * EVENT_BATCH_SIZE, (page + 1) * EVENT_BATCH_SIZE).map(event => event.id);
}

/** Lightweight filter/calendar index: never download flyer URLs or full detail payloads here. */
export function usePublicEventIndex() {
  usePublicEventsRealtime();
  const today = saoPauloTodayISO();
  return useQuery({
    queryKey: [...qk.agenda.events(), "index", today],
    staleTime: 60_000,
    gcTime: 60_000,
    queryFn: async ({ signal }) => {
      const rows = await fetchAllPages((from, to) => supabase.from("public_submissions")
        .select("id,event_title,date,start_time,location,address_neighborhood,address_city,category,description,is_free,is_suitable_for_minors,age_rating,status,is_highlight,highlight_active,highlight_hidden,highlight_until,views_count")
        .in("status", [...PUBLIC_EVENT_STATUSES])
        .or("moderation_status.is.null,moderation_status.neq.blocked")
        .eq("is_archived", false).gte("event_day", today)
        .order("date", { ascending: true }).order("start_time", { ascending: true, nullsFirst: false })
        .order("id", { ascending: true }).range(from, to).abortSignal(signal));
      return rows as AgendaEvent[];
    },
  });
}

/** One bounded detail page, preserving the caller's exact shared filtering and sorting rules. */
export function usePublicEventBatch(orderedIndex: readonly AgendaEvent[]) {
  const signature = orderedIndex.map(event => event.id).join(",");
  const [cursor, setCursor] = useState({ signature, page: 0 });
  const page = cursor.signature === signature ? cursor.page : 0;
  useEffect(() => { setCursor(current => current.signature === signature ? current : { signature, page: 0 }); }, [signature]);
  const ids = eventBatchIds(orderedIndex, page);
  const query = useQuery({
    queryKey: [...qk.agenda.events(), "batch", ids],
    enabled: ids.length > 0,
    staleTime: 60_000,
    gcTime: 60_000,
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase.from("public_submissions").select("*")
        .in("id", ids).in("status", [...PUBLIC_EVENT_STATUSES])
        .or("moderation_status.is.null,moderation_status.neq.blocked")
        .eq("is_archived", false).gte("event_day", saoPauloTodayISO())
        .limit(EVENT_BATCH_SIZE).abortSignal(signal);
      if (error) throw error;
      const byId = new Map((data ?? []).map(row => [row.id, row]));
      return ids.flatMap(id => { const row = byId.get(id); return row ? [row as AgendaEvent] : []; });
    },
  });
  const events = useMemo(() => query.data ?? [], [query.data]);
  return { ...query, events, page, hasPrevious: page > 0,
    hasNext: (page + 1) * EVENT_BATCH_SIZE < orderedIndex.length,
    next: () => setCursor({ signature, page: page + 1 }),
    previous: () => setCursor({ signature, page: Math.max(0, page - 1) }),
  };
}