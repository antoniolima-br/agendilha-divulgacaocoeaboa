import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { MobileTabBar, isTabBarHidden } from "./MobileTabBar";

describe("bottom navigation actions", () => {
  it("shows a single partnership entry and the Radar destination", () => {
    render(<MemoryRouter><MobileTabBar onMenuClick={vi.fn()} /></MemoryRouter>);
    expect(screen.getByRole("link", { name: "Meu Radar" })).toHaveAttribute("href", "/seu-radar");
    expect(screen.getByRole("button", { name: "Anunciar / Parcerias" })).toHaveAttribute("aria-haspopup", "menu");
    expect(screen.getByRole("navigation")).not.toHaveClass("md:hidden");
    expect(screen.queryByRole("button", { name: "Divulgar" })).not.toBeInTheDocument();
  });
  it("preserves hidden navigation on focused submission and auth screens", () => {
    expect(isTabBarHidden("/enviar-evento")).toBe(true);
    expect(isTabBarHidden("/auth")).toBe(true);
  });
});