import { useEffect, useState } from "react";
import { useEvents } from "@/data/events";
import { useCallback } from "react";

/**
 * Compatibility layer for the legacy useAgendaData hook.
 * Proxies to the new unified useEvents hook.
 */
export function useAgendaData() {
  const [initialEventId, setInitialEventId] = useState<string | null>(null);
  
  const { events, ratings, isLoading, trackView, trackShare } = useEvents({ includeRatings: false });
  const clearInitialEventId = useCallback(() => setInitialEventId(null), []);

  // Pick up ?event= from URL once events land.
  useEffect(() => {
    if (!events.length) return;
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get("event");
    if (eventId && events.find((e) => e.id === eventId)) {
      setInitialEventId(eventId);
    }
  }, [events]);

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
