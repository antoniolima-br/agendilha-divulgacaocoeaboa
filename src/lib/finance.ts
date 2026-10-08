export type FinanceStatus = "pending" | "paid" | "released" | "cancelled";
export type FinanceItem = {
  item_type: "evento" | "anuncio"; item_id: string; title: string;
  date: string | null; start_time: string | null; location: string | null;
  publication_status: string; status: FinanceStatus; created_at: string;
  expected_amount_cents: number | null; amount_cents: number | null;
  receipt_path: string | null; settled_at: string | null; released_at: string | null; notes: string | null;
};
export type FinanceEntry = { id: string; item_type: string; item_id: string; title?: string; item_title?: string; action?: string; amount_cents: number | null; created_at: string; notes?: string | null; actor_id?: string };
export type FinanceExpense = { id: string; description: string; category: string; amount_cents: number; expense_date: string; notes: string | null; created_by: string; created_at: string };
export type FinanceContract = { item_type: "evento" | "anuncio"; item_id: string; title: string; publication_status: string; commercial_type: "paid" | "courtesy" | "barter"; reference_amount_cents: number; starts_on: string | null; ends_on: string | null; highlight_until: string | null; workflow_status: FinanceStatus; notes: string | null; created_at: string };
export type FinanceOverview = { items: FinanceItem[]; payments: FinanceEntry[]; history: FinanceEntry[]; expenses: FinanceExpense[]; inventory: FinanceContract[] };
export const financeLabels: Record<FinanceStatus, string> = { pending: "Pendente", paid: "Pago", released: "Liberado", cancelled: "Cancelado" };
export const financeActionLabels: Record<string, string> = { edit: "Cobrança atualizada", settle: "Baixa registrada", release: "Publicação liberada", cancel: "Cobrança cancelada", contract: "Contrato atualizado" };
export const moneyBR = (cents: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
export function parseFinanceAmount(value: string): number | null {
  const normalized = value.trim().replace(/\s/g, "");
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(normalized)) return null;
  const cents = Math.round(Number(normalized.replace(/\./g, "").replace(",", ".")) * 100);
  return Number.isSafeInteger(cents) && cents >= 0 && cents <= 2147483647 ? cents : null;
}
export function financeSummary(items: FinanceItem[], payments: FinanceEntry[]) {
  return {
    received: payments.reduce((total, entry) => total + (entry.amount_cents ?? 0), 0),
    pending: items.filter((item) => item.status === "pending").length,
    paid: items.filter((item) => item.status === "paid").length,
    released: items.filter((item) => item.status === "released").length,
    cancelled: items.filter((item) => item.status === "cancelled").length,
    expected: items.filter((item) => item.status === "pending").reduce((total, item) => total + (item.expected_amount_cents ?? 0), 0),
  };
}
