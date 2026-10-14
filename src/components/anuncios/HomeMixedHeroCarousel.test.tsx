import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HomeMixedHeroCarousel } from "./HomeMixedHeroCarousel";

const engine = vi.hoisted(() => {
  let index = 0;
  const listeners = new Map<string, Set<() => void>>();
  const api = {
    clickAllowed: vi.fn(() => true),
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

function tapFlyer(side: "left" | "right") {
  const slide = screen.getByRole("button", { name: /Abrir evento Rolê/ });
  const flyer = slide.querySelector("[data-flyer]");
  if (!flyer) throw new Error("Flyer missing");
  vi.spyOn(flyer, "getBoundingClientRect").mockReturnValue({ left: 0, width: 1000 } as DOMRect);
  fireEvent.click(flyer, { detail: 1, clientX: side === "left" ? 100 : 900 });
}

describe("Home event carousel interactions", () => {
  beforeEach(() => { vi.useFakeTimers(); engine.reset(); vi.clearAllMocks(); });
  afterEach(() => { cleanup(); vi.useRealTimers(); });

  it("wraps half-flyer taps through the same state without arrows", () => {
    render(<HomeMixedHeroCarousel events={[event("1"), event("2")]} onOpenEvent={vi.fn()} />);
    tapFlyer("left");
    expect(engine.api.scrollTo).toHaveBeenLastCalledWith(1);
    expect(screen.getByRole("button", { name: "Abrir evento Rolê 2" })).toHaveAttribute("aria-hidden", "false");
    expect(screen.queryByLabelText("Escolher destaque")).not.toBeInTheDocument();
    tapFlyer("right");
    expect(engine.api.scrollTo).toHaveBeenLastCalledWith(0);
    expect(screen.queryByRole("button", { name: "Destaque anterior" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Próximo destaque" })).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("handles missing, empty, single and shrinking lists", () => {
    const view = render(<HomeMixedHeroCarousel events={null} onOpenEvent={vi.fn()} />);
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    view.rerender(<HomeMixedHeroCarousel events={[event("1"), event("2")]} onOpenEvent={vi.fn()} />);
    tapFlyer("right");
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
    const hover = new Event("pointerover", { bubbles: true });
    Object.defineProperty(hover, "pointerType", { value: "mouse" });
    fireEvent(screen.getByRole("region"), hover);
    engine.api.scrollTo.mockClear();
    act(() => vi.advanceTimersByTime(10000));
    expect(engine.api.scrollTo).not.toHaveBeenCalled();
  });

  it("resumes five seconds after touch ends", () => {
    render(<HomeMixedHeroCarousel events={[event("1"), event("2")]} onOpenEvent={vi.fn()} />);
    fireEvent.touchStart(screen.getByRole("region"));
    act(() => vi.advanceTimersByTime(10000));
    expect(engine.api.scrollTo).not.toHaveBeenCalled();
    fireEvent.touchEnd(screen.getByRole("region"));
    act(() => vi.advanceTimersByTime(5000));
    expect(engine.api.scrollTo).toHaveBeenLastCalledWith(1);
  });

  it("does not open event details after dragging", () => {
    render(<HomeMixedHeroCarousel events={[event("1"), event("2")]} onOpenEvent={vi.fn()} />);
    const suppressedClick = new MouseEvent("click", { bubbles: true, cancelable: true });
    suppressedClick.preventDefault();
    fireEvent(screen.getByRole("button", { name: "Abrir evento Rolê 1" }), suppressedClick);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("opens details from title activation", () => {
    render(<HomeMixedHeroCarousel events={[event("1"), event("2")]} onOpenEvent={vi.fn()} />);
    fireEvent.click(screen.getByRole("heading", { name: "Rolê 1" }), { detail: 1 });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(engine.api.scrollTo).not.toHaveBeenCalled();
  });
  it("supports keyboard navigation and suppresses taps after swiping", () => {
    render(<HomeMixedHeroCarousel events={[event("1"), event("2")]} onOpenEvent={vi.fn()} />);
    fireEvent.keyDown(screen.getByRole("region"), { key: "ArrowRight" });
    expect(engine.api.scrollTo).toHaveBeenLastCalledWith(1);
    engine.api.clickAllowed.mockReturnValueOnce(false);
    engine.api.scrollTo.mockClear();
    tapFlyer("right");
    expect(engine.api.scrollTo).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("keeps slide bounds but mounts images only for active and neighboring flyers", () => {
    const { container } = render(<HomeMixedHeroCarousel events={[1, 2, 3, 4, 5, 6].map((id) => ({ ...event(String(id)), image_url: `/flyer-${id}.webp` }))} onOpenEvent={vi.fn()} />);
    expect(container.querySelectorAll('button[aria-label^="Abrir evento"]')).toHaveLength(6);
    expect(container.querySelectorAll("img")).toHaveLength(6);
    expect(container.querySelectorAll('img[fetchpriority="high"]')).toHaveLength(1);
    expect(container.querySelector('img[src="/flyer-3.webp"]')).toBeNull();
    tapFlyer("right");
    expect(container.querySelector('img[src="/flyer-3.webp"]')).toBeInTheDocument();
    expect(container.querySelector('img[src="/flyer-6.webp"]')).toBeNull();
  });
});