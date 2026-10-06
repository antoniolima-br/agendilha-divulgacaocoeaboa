import { supabase } from "@/integrations/supabase/client";
import { addDaysToISO, isCurrentOrFutureEventDate, PUBLIC_EVENT_STATUSES, saoPauloTodayISO } from "@/lib/eventDate";
import { logRuntimeError } from "@/lib/runtimeDiagnostics";

/** Read-only, visitor-safe event row. Only public columns from the public view. */
export type PublicEvent = Readonly<{
  id: string;
  slug: string | null;
  event_title: string | null;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  address_neighborhood: string | null;
  duvidas_phone: string | null;
  is_highlight: boolean;
}>;

const PUBLIC_COLUMNS =
  "id, slug, event_title, date, start_time, end_time, location, address_neighborhood, duvidas_phone, is_highlight";

/**
 * Fetches published events through the anon-readable `public_submissions` view.
 * Never touches the `submissions` table or any form/admin state.
 */
export async function fetchPublicEventsList(): Promise<PublicEvent[]> {
  try {
    const { data, error } = await supabase
      .from("public_submissions")
      .select(PUBLIC_COLUMNS)
      .in("status", [...PUBLIC_EVENT_STATUSES])
      .or("moderation_status.is.null,moderation_status.neq.blocked")
      .gte("date", addDaysToISO(saoPauloTodayISO(), -1))
      .order("date", { ascending: true })
      .order("start_time", { ascending: true })
      .limit(500);
    if (error) throw error;
    if (!Array.isArray(data)) return [];
    return data
      .filter((row) => Boolean(row?.id) && isCurrentOrFutureEventDate(row.date))
      .map((row) => ({ ...row, is_highlight: Boolean(row.is_highlight) }) as PublicEvent);
  } catch (error) {
    logRuntimeError("PublicEvents.fetch", error);
    throw error;
  }
}
