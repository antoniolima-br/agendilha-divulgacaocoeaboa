import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HomeMixedHeroCarousel } from "./HomeMixedHeroCarousel";

const engine = vi.hoisted(() => {
  let index = 0;
  const listeners = new Map<string, Set<() => void>>();
  const api = {
    selectedScrollSnap: () => index,
    scrollTo: vi.fn((next: number) => { index = next; listeners.get("select")?.forEach(fn => fn()); }),
    on: (name: string, fn: () => void) => {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name)?.add(fn);
      return api;
    },
    off: (name: string, fn: () => void) => { listeners.get(name)?.delete(fn); return api; },
  };
  return { api, reset: () => { index = 0; listeners.clear(); } };
});
vi.mock("embla-carousel-react", () => ({ default: () => [vi.fn(), engine.api] }));

const event = (id: string) => ({ id, event_title: `Rolê ${id}`, date: "2026-10-10", start_time: "19:00", location: "Local", address_neighborhood: "Ramos", category: "Shows" });

describe("Home event carousel interactions", () => {
  beforeEach(() => { vi.useFakeTimers(); engine.reset(); vi.clearAllMocks(); });
  afterEach(() => { cleanup(); vi.useRealTimers(); });

  it("wraps next and previous arrows through the same slide state", () => {
    render(<HomeMixedHeroCarousel events={[event("1"), event("2")]} onOpenEvent={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Destaque anterior" }));
    expect(engine.api.scrollTo).toHaveBeenLastCalledWith(1);
    expect(screen.getByRole("button", { name: "Ver destaque 2" })).toHaveAttribute("aria-current", "true");
    fireEvent.click(screen.getByRole("button", { name: "Próximo destaque" }));
    expect(engine.api.scrollTo).toHaveBeenLastCalledWith(0);
  });

  it("handles missing, empty, single and shrinking lists", () => {
    const view = render(<HomeMixedHeroCarousel events={null} onOpenEvent={vi.fn()} />);
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    view.rerender(<HomeMixedHeroCarousel events={[event("1"), event("2")]} onOpenEvent={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Próximo destaque" }));
    view.rerender(<HomeMixedHeroCarousel events={[event("1")]} onOpenEvent={vi.fn()} />);
    expect(screen.getByRole("region")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Próximo destaque" })).not.toBeInTheDocument();
    view.rerender(<HomeMixedHeroCarousel events={[]} onOpenEvent={vi.fn()} />);
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("rotates at five seconds and pauses during hover", () => {
    render(<HomeMixedHeroCarousel events={[event("1"), event("2")]} onOpenEvent={vi.fn()} />);
    act(() => vi.advanceTimersByTime(4999));
    expect(engine.api.scrollTo).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(engine.api.scrollTo).toHaveBeenLastCalledWith(1);
    fireEvent.mouseEnter(screen.getByRole("region"));
    engine.api.scrollTo.mockClear();
    act(() => vi.advanceTimersByTime(10000));
    expect(engine.api.scrollTo).not.toHaveBeenCalled();
  });

  it("does not open event details after dragging", () => {
    render(<HomeMixedHeroCarousel events={[event("1"), event("2")]} onOpenEvent={vi.fn()} />);
    const suppressedClick = new MouseEvent("click", { bubbles: true, cancelable: true });
    suppressedClick.preventDefault();
    fireEvent(screen.getByRole("button", { name: "Abrir evento Rolê 1" }), suppressedClick);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});