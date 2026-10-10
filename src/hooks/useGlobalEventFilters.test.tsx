import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { clearGlobalEventFilters, getGlobalEventFilters, setGlobalEventFilters, useGlobalEventFilters } from "./useGlobalEventFilters";

describe("shared filter snapshots", () => {
  beforeEach(() => clearGlobalEventFilters());
  it("preserves snapshot identity and avoids renders for unchanged filters", () => {
    let renders = 0;
    const { result } = renderHook(() => { renders++; return useGlobalEventFilters(); });
    const snapshot = result.current.filters;
    const count = renders;
    act(() => setGlobalEventFilters({ region: "all", category: "all" }));
    expect(getGlobalEventFilters()).toBe(snapshot);
    expect(renders).toBe(count);
  });
  it("still clears neighborhood when changing regions and retains explicit neighborhoods", () => {
    setGlobalEventFilters({ region: "Zona Norte", neighborhood: "Ramos" });
    setGlobalEventFilters({ region: "Zona Sul" });
    expect(getGlobalEventFilters().neighborhood).toBe("all");
    setGlobalEventFilters({ region: "Zona Norte", neighborhood: "Olaria" });
    expect(getGlobalEventFilters().neighborhood).toBe("Olaria");
  });
});