import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { qk } from "@/data/queryKeys";
import type { FinanceOverview } from "@/lib/finance";
export type FinanceCommand = { itemType: "evento" | "anuncio"; itemId: string; action: "edit" | "settle" | "release" | "cancel"; amount?: number; receiptPath?: string; notes?: string; release?: boolean };
export function useFinance() {
  const { user } = useAuth();
  const { canViewFinance, canSettlePayments } = useAppPermissions();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: qk.finance.overview(user?.id ?? null), enabled: !!user && canViewFinance,
    queryFn: async (): Promise<FinanceOverview> => {
      const { data, error } = await supabase.rpc("finance_overview");
      if (error) throw error;
      if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Não deu pra carregar o financeiro. Tenta de novo.");
      return data as unknown as FinanceOverview;
    },
  });
  const mutation = useMutation({
    mutationFn: async (command: FinanceCommand) => {
      if (!user || !canSettlePayments) throw new Error("Seu acesso ao financeiro é somente leitura.");
      const { data, error } = await supabase.rpc("finance_manage", {
        p_item_type: command.itemType, p_item_id: command.itemId, p_action: command.action,
        p_amount_cents: command.amount, p_receipt_path: command.receiptPath,
        p_notes: command.notes, p_release: command.release ?? false,
      });
      if (error) throw error;
      if (!data || typeof data !== "object" || Array.isArray(data) || data.success !== true) throw new Error("Não deu pra confirmar a alteração.");
    },
    onSuccess: async () => {
      await Promise.all([qk.finance.all, qk.highlights.all, qk.highlights.publicList(), qk.ads.all, qk.submissions.all, qk.agenda.all, qk.home.all, qk.curation.all].map((queryKey) => client.invalidateQueries({ queryKey })));
    },
  });
  return { ...query, mutation };
}
