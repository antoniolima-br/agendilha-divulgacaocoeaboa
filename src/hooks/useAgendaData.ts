import { useSearchParams } from "react-router-dom";
import { useEvents } from "@/data/events";
import { useCallback } from "react";
import { usePublicEventIndex } from "@/data/pagedPublicEvents";

/**
 * Compatibility layer for the legacy useAgendaData hook.
 * Proxies to the new unified useEvents hook.
 */
export function useAgendaData() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const { ratings, trackView, trackShare } = useEvents({ includeRatings: false, enabled: false });
  const { data: events = [], isLoading } = usePublicEventIndex();
  const eventId = searchParams.get("event");
  const initialEventId = events.some((event) => event.id === eventId) ? eventId : null;
  // Consume the router deep link so refreshed data cannot reopen the dialog.
  const clearInitialEventId = useCallback(() => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete("event");
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  return {
    events,
    ratings,
    loading: isLoading,
    trackView,
    trackShare,
    initialEventId,
    clearInitialEventId,
  };
}
