import type { FinanceOverview, FinanceContract } from "./finance";
import { saoPauloTodayISO } from "./eventDate";
export const commercialLabels = { paid: "Pago", courtesy: "Cortesia", barter: "Permuta" };
export function inventoryStatus(item: FinanceContract, today = saoPauloTodayISO()) {
  const end = item.ends_on ?? item.highlight_until?.slice(0, 10);
  if (item.workflow_status === "cancelled") return "Cancelado";
  if (end && end < today) return "Encerrado";
  if (item.starts_on && item.starts_on > today) return "Agendado";
  return item.publication_status === "publicado" ? "Em veiculação" : "Aguardando";
}
export function cashbook(data: FinanceOverview) {
  return [...data.payments.map((p) => ({ id: `payment-${p.id}`, date: p.created_at.slice(0, 10), title: p.title ?? "Receita", category: p.item_type === "evento" ? "Evento patrocinado" : "Espaço publicitário", amount: p.amount_cents ?? 0, direction: "in" as const })), ...data.expenses.map((e) => ({ id: `expense-${e.id}`, date: e.expense_date, title: e.description, category: e.category, amount: e.amount_cents, direction: "out" as const }))].sort((a, b) => b.date.localeCompare(a.date));
}
export function financeAnalytics(data: FinanceOverview, from = "", to = "9999-12-31") {
  const included = (date: string) => date.slice(0, 10) >= from && date.slice(0, 10) <= to;
  const payments = data.payments.filter((p) => included(p.created_at));
  const expenses = data.expenses.filter((e) => included(e.expense_date));
  const revenue = payments.reduce((n, p) => n + (p.amount_cents ?? 0), 0);
  const spent = expenses.reduce((n, e) => n + e.amount_cents, 0);
  const months = new Map<string, { month: string; revenue: number; expenses: number; balance: number }>();
  for (const row of [...payments.map((p) => ({ date: p.created_at, revenue: p.amount_cents ?? 0, expense: 0 })), ...expenses.map((e) => ({ date: e.expense_date, revenue: 0, expense: e.amount_cents }))]) {
    const month = row.date.slice(0, 7);
    const point = months.get(month) ?? { month, revenue: 0, expenses: 0, balance: 0 };
    point.revenue += row.revenue; point.expenses += row.expense; point.balance = point.revenue - point.expenses; months.set(month, point);
  }
  const sources = ["evento", "anuncio"].map((type) => ({ name: type === "evento" ? "Eventos patrocinados" : "Espaços publicitários", revenue: payments.filter((p) => p.item_type === type).reduce((n, p) => n + (p.amount_cents ?? 0), 0) }));
  return { revenue, expenses: spent, balance: revenue - spent, months: [...months.values()].sort((a, b) => a.month.localeCompare(b.month)), sources, courtesy: data.inventory.filter((i) => i.commercial_type === "courtesy").length, barter: data.inventory.filter((i) => i.commercial_type === "barter").length };
}