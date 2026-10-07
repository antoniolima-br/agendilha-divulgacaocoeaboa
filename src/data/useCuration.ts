import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { qk } from "./queryKeys";
import { PUBLIC_EVENT_STATUSES } from "@/lib/eventDate";
import type { Tables } from "@/integrations/supabase/types";

export type CurationEvent = Pick<Tables<"submissions">, "id" | "event_title" | "date" | "start_time" | "end_time" | "location" | "status" | "image_url" | "category" | "responsible_name" | "description">;
export function useCuration(enabled: boolean, status: "pending" | "approved") {
  const { user } = useAuth();
  return useQuery({
    queryKey: qk.curation.list(user?.id, status), enabled: enabled && !!user,
    queryFn: async () => {
      const rows: CurationEvent[] = [];
      for (let offset = 0; ; offset += 500) {
        let query = supabase.from("submissions").select("id,event_title,date,start_time,end_time,location,status,image_url,category,responsible_name,description")
          .is("deleted_at", null).order("created_at", { ascending: false }).order("id");
        query = status === "pending" ? query.eq("status", "pendente") : query.in("status", [...PUBLIC_EVENT_STATUSES]);
        const { data, error } = await query.range(offset, offset + 499);
        if (error) throw error;
        rows.push(...(data ?? []));
        if (!data || data.length < 500) return rows;
      }
    },
  });
}
export function useCurationDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user) throw new Error("Sua sessão expirou. Entre novamente.");
      const now = new Date().toISOString();
      const patch = approve ? { status: "aprovado", approved_at: now, approved_by: auth.user.id } : { status: "rejeitado", rejected_at: now, rejected_by: auth.user.id };
      const { data, error } = await supabase.from("submissions").update(patch).eq("id", id).eq("status", "pendente").select("id,status").maybeSingle();
      if (error) throw error;
      if (!data || data.status !== patch.status) throw new Error("O evento já foi revisado ou você não tem permissão. Atualize a lista.");
      return data;
    },
    onSuccess: async () => {
      await Promise.all([qk.curation.all, qk.submissions.all, qk.agenda.all, qk.home.all, qk.highlights.publicList()].map((queryKey) => qc.invalidateQueries({ queryKey })));
    },
  });
}