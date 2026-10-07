import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { qk } from "./queryKeys";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";

export function useMyEventHistory(userId: string | undefined) {
  const { user } = useAuth();
  const ownerId = user?.id;
  return useQuery({
    queryKey: qk.submissions.mine(ownerId),
    enabled: !!ownerId && userId === ownerId,
    staleTime: 30_000,
    queryFn: async (): Promise<Tables<"submissions">[]> => {
      if (!ownerId || userId !== ownerId) return [];
      const rows: Tables<"submissions">[] = [];
      const pageSize = 500;
      for (let offset = 0; ; offset += pageSize) {
        const { data, error } = await supabase.from("submissions").select("*")
          .eq("user_id", ownerId).is("deleted_at", null)
          .order("created_at", { ascending: false }).order("id", { ascending: false })
          .range(offset, offset + pageSize - 1);
        if (error) throw error;
        rows.push(...(data ?? []));
        if (!data || data.length < pageSize) return rows;
      }
    },
  });
}