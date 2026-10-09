import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { qk } from "@/data/queryKeys";

export function useAdProducts(enabled = true) {
  return useQuery({ queryKey: qk.ads.products(), enabled, queryFn: async () => {
    const { data, error } = await supabase.from("ad_products").select("*").order("display_order");
    if (error) throw error;
    return data;
  }});
}
export function useSetAdProductActive() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
    const { data, error } = await supabase.from("ad_products").update({ is_active: active }).eq("id", id).select("id,is_active").single();
    if (error) throw error;
    if (data.is_active !== active) throw new Error("Não foi possível confirmar a alteração do produto.");
  }, onSuccess: () => void qc.invalidateQueries({ queryKey: qk.ads.all }) });
}