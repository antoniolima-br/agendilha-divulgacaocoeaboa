import { act, renderHook } from "@testing-library/react";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAgendaData } from "./useAgendaData";

const source = vi.hoisted(() => ({ events: [] as { id: string }[] }));
vi.mock("@/data/pagedPublicEvents", () => ({ usePublicEventIndex: () => ({ data: source.events, isLoading: false }) }));
vi.mock("@/data/events", () => ({
  useEvents: () => ({ events: source.events, ratings: {}, isLoading: false, trackView: vi.fn(), trackShare: vi.fn() }),
}));

function wrapper({ children }: PropsWithChildren) {
  return <MemoryRouter initialEntries={["/agenda?event=event-one&date=2026-10-14&region=zona-norte"]}>{children}</MemoryRouter>;
}

describe("useAgendaData detail deep links", () => {
  beforeEach(() => { source.events = [{ id: "event-one" }]; });

  it("consumes the event link and preserves all other filters across refreshes", () => {
    const { result, rerender } = renderHook(() => ({ data: useAgendaData(), location: useLocation() }), { wrapper });
    expect(result.current.data.initialEventId).toBe("event-one");
    act(() => result.current.data.clearInitialEventId());
    expect(result.current.data.initialEventId).toBeNull();
    expect(result.current.location.search).toBe("?date=2026-10-14&region=zona-norte");
    source.events = [{ id: "event-one" }, { id: "event-two" }];
    rerender();
    expect(result.current.data.initialEventId).toBeNull();
    act(() => result.current.data.clearInitialEventId());
    expect(result.current.data.initialEventId).toBeNull();
  });

  it("waits for data, then allows a genuinely new event link", () => {
    source.events = [];
    const { result, rerender } = renderHook(() => ({ data: useAgendaData(), navigate: useNavigate() }), { wrapper });
    expect(result.current.data.initialEventId).toBeNull();
    source.events = [{ id: "event-one" }, { id: "event-two" }];
    rerender();
    expect(result.current.data.initialEventId).toBe("event-one");
    act(() => result.current.data.clearInitialEventId());
    act(() => result.current.navigate("/agenda?event=event-two"));
    expect(result.current.data.initialEventId).toBe("event-two");
  });

  it("replaces history so back navigation cannot restore the consumed event link", () => {
    const { result } = renderHook(() => ({ data: useAgendaData(), navigate: useNavigate(), location: useLocation() }), { wrapper });
    act(() => result.current.data.clearInitialEventId());
    act(() => result.current.navigate("/outra-pagina"));
    act(() => result.current.navigate(-1));
    expect(result.current.location.pathname).toBe("/agenda");
    expect(result.current.data.initialEventId).toBeNull();
    expect(new URLSearchParams(result.current.location.search).has("event")).toBe(false);
  });
});