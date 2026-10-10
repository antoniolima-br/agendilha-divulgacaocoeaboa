import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { GuideLauncher } from "./GuideLauncher";
import { OPEN_KOE_EVENT } from "@/components/layout/MobileTabBar";
vi.mock("./CoezinhoChat", () => ({ CoezinhoChat: () => <div role="dialog">Guia aberto</div> }));
describe("light guide launcher", () => {
  it("keeps chat closed until clicked", async () => {
    render(<MemoryRouter><GuideLauncher /></MemoryRouter>);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Falar com o Guia do Coé" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
  it("responds to the mobile event and to intent received while loading", async () => {
    const view = render(<MemoryRouter><GuideLauncher /></MemoryRouter>);
    act(() => window.dispatchEvent(new Event(OPEN_KOE_EVENT)));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    view.unmount();
    const other = render(<MemoryRouter><GuideLauncher /></MemoryRouter>);
    other.rerender(<MemoryRouter><GuideLauncher initiallyOpen /></MemoryRouter>);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
});