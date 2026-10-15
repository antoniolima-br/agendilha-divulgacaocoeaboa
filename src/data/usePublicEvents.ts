import { useQuery } from "@tanstack/react-query";
import { usePublicEventsRealtime } from "./publicEventsRealtime";
import { publicEventsQueryOptions } from "./publicEventsQuery";
export function usePublicEvents(options: { enabled?: boolean; staleTime?: number } = {}) {
  usePublicEventsRealtime(options.enabled ?? true);
  return useQuery({
    ...publicEventsQueryOptions(options.staleTime),
    enabled: options.enabled,
  });
}
