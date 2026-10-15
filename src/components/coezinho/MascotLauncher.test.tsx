import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MascotLauncher } from "./MascotLauncher";

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
function Harness() {
  const navigate = useNavigate();
  return <><MascotLauncher onOpen={vi.fn()} /><button onClick={() => navigate("/explorar")}>Explorar</button></>;
}
const mascot = () => screen.getByRole("button", { name: "Falar com o Guia do Coé" });
describe("mascot standby", () => {
  it("starts in the lower left above navigation", () => {
    render(<MemoryRouter><Harness /></MemoryRouter>);
    expect(mascot().style.left).toBe("16px");
    expect(Number.parseFloat(mascot().style.top)).toBeGreaterThan(window.innerHeight / 2);
    expect(Number.parseFloat(mascot().style.top) + 104).toBeLessThan(window.innerHeight - 16);
  });
  it("stays visible for four seconds even while the rest of the page is active", () => {
    vi.useFakeTimers();
    render(<MemoryRouter><Harness /></MemoryRouter>);
    act(() => vi.advanceTimersByTime(3999));
    expect(mascot()).toHaveAttribute("data-idle", "false");
    fireEvent.pointerMove(window);
    fireEvent.scroll(window);
    act(() => vi.advanceTimersByTime(1));
    expect(mascot()).toHaveAttribute("data-idle", "true");
  });
  it("wakes immediately on hover, touch and keyboard focus", () => {
    vi.useFakeTimers();
    render(<MemoryRouter><Harness /></MemoryRouter>);
    act(() => vi.advanceTimersByTime(4000));
    fireEvent.pointerEnter(mascot(), { pointerType: "mouse" });
    expect(mascot()).toHaveAttribute("data-idle", "false");
    act(() => vi.advanceTimersByTime(5000));
    expect(mascot()).toHaveAttribute("data-idle", "false");
    fireEvent.pointerLeave(mascot());
    act(() => vi.advanceTimersByTime(4000));
    expect(mascot()).toHaveAttribute("data-idle", "true");
    fireEvent.pointerEnter(mascot(), { pointerType: "touch" });
    expect(mascot()).toHaveAttribute("data-idle", "false");
    fireEvent.pointerLeave(mascot());
    act(() => vi.advanceTimersByTime(4000));
    fireEvent.focus(mascot());
    expect(mascot()).toHaveAttribute("data-idle", "false");
  });
  it("restarts the four-second appearance on a discovery page", () => {
    vi.useFakeTimers();
    render(<MemoryRouter><Harness /></MemoryRouter>);
    act(() => vi.advanceTimersByTime(4000));
    expect(mascot()).toHaveAttribute("data-idle", "true");
    fireEvent.click(screen.getByRole("button", { name: "Explorar" }));
    expect(mascot()).toHaveAttribute("data-idle", "false");
    act(() => vi.advanceTimersByTime(4000));
    expect(mascot()).toHaveAttribute("data-idle", "true");
  });
});