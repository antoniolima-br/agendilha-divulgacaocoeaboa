import { describe, it, expect } from "vitest";
import { parseFinanceAmount, financeSummary, type FinanceItem } from "./finance";
describe("finance", () => {
  it("valida reais sem truncar texto ou aceitar valores negativos", () => {
    expect(parseFinanceAmount("1.234,56")).toBe(123456);
    expect(parseFinanceAmount("49,90")).toBe(4990);
    expect(parseFinanceAmount("0")).toBe(0);
    for (const value of ["", "-5", "49,90abc", "2.50", "1,234", "999999999999999"]) expect(parseFinanceAmount(value)).toBeNull();
  });
  it("entradas são baixas, nunca valores de cobranças ou liberações", () => {
    const items = [{ status: "pending", expected_amount_cents: 5000 }, { status: "released", expected_amount_cents: 9000 }, { status: "cancelled", expected_amount_cents: 9000 }] as FinanceItem[];
    const report = financeSummary(items, [{ id: "p", item_type: "evento", item_id: "e", amount_cents: 6000, created_at: "2026-10-07" }]);
    expect(report.received).toBe(6000);
    expect(report.expected).toBe(5000);
    expect(report.released).toBe(1);
    expect(report.cancelled).toBe(1);
  });
});