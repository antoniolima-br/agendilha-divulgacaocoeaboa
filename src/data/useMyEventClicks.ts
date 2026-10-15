import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
export function useMyEventClicks() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["organizer-event-clicks", user?.id], enabled: !!user, staleTime: 30_000,
    queryFn: async (): Promise<Record<string, number>> => {
      const { data, error } = await supabase.rpc("my_event_click_metrics");
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((row) => [row.event_id, Number(row.clicks_count)]));
    },
  });
}
