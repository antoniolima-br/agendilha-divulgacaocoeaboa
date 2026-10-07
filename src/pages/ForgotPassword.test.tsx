import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ForgotPassword from "./ForgotPassword";

const state = vi.hoisted(() => ({ settings: { team_whatsapp: "21998554322", team_contact_name: "TONI LIMA" }, loading: false }));
vi.mock("@/data/useAppSettings", () => ({
  SETTING_KEYS: { teamWhatsapp: "team_whatsapp", teamContactName: "team_contact_name" },
  settingOr: (settings: Record<string, string>, key: string) => settings?.[key] || "",
  useAppSettings: () => ({ data: state.settings, isLoading: state.loading, isError: false, refetch: vi.fn() }),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

describe("WhatsApp recovery", () => {
  beforeEach(() => { vi.clearAllMocks(); state.settings.team_whatsapp = "21998554322"; });
  it("offers no PIN or anonymous password and opens only an identity-verification request", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<MemoryRouter><ForgotPassword /></MemoryRouter>);
    expect(screen.queryByText(/PIN/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("E-mail ou WhatsApp da conta"), { target: { value: "21987654321" } });
    fireEvent.click(screen.getByRole("button", { name: "Solicitar pelo WhatsApp" }));
    expect(open).toHaveBeenCalledOnce();
    const url = new URL(String(open.mock.calls[0][0]));
    expect(url.hostname).toBe("wa.me");
    expect(url.pathname).toBe("/5521998554322");
    expect(url.searchParams.get("text")).toContain("confirmar minha identidade");
    expect(screen.getByRole("status")).toHaveTextContent("Sua senha atual só muda");
  });
  it("keeps recovery disabled without a verified team contact", () => {
    state.settings.team_whatsapp = "";
    render(<MemoryRouter><ForgotPassword /></MemoryRouter>);
    expect(screen.getByRole("button", { name: "Solicitar pelo WhatsApp" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("contato da equipe");
  });
});