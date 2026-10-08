import { describe, expect, it } from "vitest";
import { cashbook, financeAnalytics, inventoryStatus } from "./financeAnalytics";
import type { FinanceOverview, FinanceContract } from "./finance";
const data: FinanceOverview = { items: [], history: [], payments: [{ id: "p", item_type: "evento", item_id: "e", amount_cents: 10000, created_at: "2026-10-08" }], expenses: [{ id: "x", description: "Equipe", category: "Equipe", amount_cents: 2500, expense_date: "2026-10-07", notes: null, created_by: "u", created_at: "2026-10-08" }], inventory: [{ commercial_type: "barter" } as FinanceContract] };
describe("finance analytics", () => {
  it("saldo soma só pagamentos e subtrai despesas, sem permutas", () => { expect(financeAnalytics(data)).toMatchObject({ revenue: 10000, expenses: 2500, balance: 7500, barter: 1 }); });
  it("filtra pelo dia da despesa e consolida meses", () => { expect(financeAnalytics(data, "2026-10-08").expenses).toBe(0); expect(financeAnalytics(data).months[0]).toMatchObject({ month: "2026-10", balance: 7500 }); });
  it("livro caixa ordena lançamentos sem alterar a origem", () => { expect(cashbook(data).map((r) => r.direction)).toEqual(["in", "out"]); expect(data.payments).toHaveLength(1); });
  it("inventário diferencia agendado, encerrado e cancelado", () => { const item = { publication_status: "publicado", starts_on: "2026-10-09", ends_on: "2026-10-12" } as FinanceContract; expect(inventoryStatus(item, "2026-10-08")).toBe("Agendado"); expect(inventoryStatus(item, "2026-10-10")).toBe("Em veiculação"); expect(inventoryStatus(item, "2026-10-13")).toBe("Encerrado"); });
});