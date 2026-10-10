import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { emitEntityChanged, useEntityRevision } from "./entityEvents";

describe("shared entity revision", () => {
  it("updates only the requested entity type", () => {
    const { result } = renderHook(() => useEntityRevision(["atrativo"]));
    act(() => emitEntityChanged("estabelecimento"));
    expect(result.current).toBe(0);
    act(() => emitEntityChanged("atrativo"));
    expect(result.current).toBe(1);
  });
  it("keeps the subscription when passed a fresh equivalent array", () => {
    const { result, rerender } = renderHook(() => useEntityRevision(["estabelecimento"]));
    rerender();
    act(() => emitEntityChanged("estabelecimento"));
    expect(result.current).toBe(1);
  });
  it("changes subscriptions without resetting the revision", () => {
    const { result, rerender } = renderHook(({ type }: { type: "atrativo" | "estabelecimento" }) => useEntityRevision([type]), { initialProps: { type: "atrativo" } });
    act(() => emitEntityChanged("atrativo"));
    rerender({ type: "estabelecimento" });
    act(() => emitEntityChanged("atrativo"));
    expect(result.current).toBe(1);
    act(() => emitEntityChanged("estabelecimento"));
    expect(result.current).toBe(2);
  });
});