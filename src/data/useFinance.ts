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
    queryKey: qk.finance.overview(user?.id ?? null), enabled: !!user && canViewFinance, refetchInterval: 30_000,
    queryFn: async (): Promise<FinanceOverview> => {
      const { data, error } = await supabase.rpc("finance_dashboard");
      if (error) throw error;
      if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Não deu pra carregar o financeiro. Tenta de novo.");
      return data as unknown as FinanceOverview;
    },
  });
  const refresh = async () => {
    await Promise.all([qk.finance.all, qk.highlights.all, qk.highlights.publicList(), qk.ads.all, qk.submissions.all, qk.agenda.all, qk.home.all, qk.curation.all].map((queryKey) => client.invalidateQueries({ queryKey })));
  };
  const mutation = useMutation({
    mutationFn: async (command: FinanceCommand) => {
      if (!user || !canSettlePayments) throw new Error("Seu acesso ao financeiro é somente leitura.");
      const { data, error } = await supabase.rpc("finance_manage", {
        p_item_type: command.itemType, p_item_id: command.itemId, p_action: command.action,
        p_amount_cents: command.amount, p_receipt_path: command.receiptPath,
        p_notes: command.notes, p_release: command.action === "settle" || command.release === true,
      });
      if (error) throw error;
      if (!data || typeof data !== "object" || Array.isArray(data) || data.success !== true) throw new Error("Não deu pra confirmar a alteração.");
    },
    onSuccess: refresh,
  });
  const expenseMutation = useMutation({
    mutationFn: async (input: { description: string; category: string; amount: number; date: string; notes: string }) => {
      if (!user || !canSettlePayments) throw new Error("Seu acesso ao financeiro é somente leitura.");
      const { data, error } = await supabase.rpc("finance_add_expense", { p_description: input.description, p_category: input.category, p_amount_cents: input.amount, p_expense_date: input.date, p_notes: input.notes });
      if (error) throw error;
      if (!data || typeof data !== "object" || Array.isArray(data) || data.success !== true) throw new Error("Não deu pra confirmar a despesa.");
    }, onSuccess: refresh,
  });
  const contractMutation = useMutation({
    mutationFn: async (input: { itemType: "evento" | "anuncio"; itemId: string; commercialType: "paid" | "courtesy" | "barter"; amount: number; startsOn?: string; endsOn?: string; notes: string }) => {
      if (!user || !canSettlePayments) throw new Error("Seu acesso ao financeiro é somente leitura.");
      const { data, error } = await supabase.rpc("finance_save_contract", { p_item_type: input.itemType, p_item_id: input.itemId, p_commercial_type: input.commercialType, p_reference_amount_cents: input.amount, p_starts_on: input.startsOn, p_ends_on: input.endsOn, p_notes: input.notes });
      if (error) throw error;
      if (!data || typeof data !== "object" || Array.isArray(data) || data.success !== true) throw new Error("Não deu pra confirmar o contrato.");
    }, onSuccess: refresh,
  });
  return { ...query, mutation, expenseMutation, contractMutation };
}
