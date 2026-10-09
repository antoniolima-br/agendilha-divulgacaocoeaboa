import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { buildPitchContent } from "../../../supabase/functions/commercial-pitch/content";
import AdminPitchComercial from "../AdminPitchComercial";

const mocks = vi.hoisted(() => ({ call: vi.fn(), allowed: true, userId: "test-user" }));
vi.mock("@/lib/edge", () => ({ callEdge: mocks.call }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: mocks.userId }, mustChangePassword: false }) }));
vi.mock("@/hooks/useAppPermissions", () => ({ useAppPermissions: () => ({ hasPermission: () => mocks.allowed }) }));
const page = () => <HelmetProvider><AdminPitchComercial /></HelmetProvider>;

describe("pitch comercial", () => {
  beforeEach(() => { mocks.allowed = true; mocks.userId = "test-user"; mocks.call.mockReset(); });
  it("calcula projeções sem dupla contagem ou confundir saldo com lucro", () => {
    const content = buildPitchContent();
    expect(content.scenarios.map((s) => s.revenue)).toEqual([1360, 4080, 8160]);
    expect(content.scenarios.map((s) => s.afterMarketing)).toEqual([860, 3330, 7160]);
    expect(content.scenarios.every((s) => s.placements / s.regions === 3)).toBe(true);
    expect(content.disclaimer).toContain("não é lucro líquido");
    expect(content.brandPositioning).toContain("produto oficial");
    expect(content.brandPositioning).toContain("Rio de Janeiro");
    expect(content.monetization).toContain("venda profissional de espaços publicitários");
    expect(content.projectionBasis).toContain("não taxas simbólicas");
    expect(content.scenarios.every((s) => s.placementRevenue > s.marketing)).toBe(true);
  });
  it("só exibe após conferência, permite bloquear e limpa o campo", async () => {
    mocks.call.mockResolvedValue({ content: buildPitchContent(), expiresInSeconds: 900 });
    render(page());
    expect(screen.queryByText("Projeção de receita mensal")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Senha do pitch"), { target: { value: "synthetic-test-input" } });
    fireEvent.click(screen.getByRole("button", { name: "Abrir pitch" }));
    await screen.findByText("Projeção de receita mensal");
    expect(screen.getByRole("heading", { name: /^Coé a Boa\?$/ })).toBeInTheDocument();
    expect(screen.getByText(buildPitchContent().monetization)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Bloquear" }));
    expect(screen.queryByText("Projeção de receita mensal")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Senha do pitch")).toHaveValue("");
  });
  it("mantém fechado quando a senha é recusada", async () => {
    mocks.call.mockRejectedValue(new Error("Senha incorreta. Confira e tente novamente."));
    render(page());
    fireEvent.change(screen.getByLabelText("Senha do pitch"), { target: { value: "synthetic-test-input" } });
    fireEvent.click(screen.getByRole("button", { name: "Abrir pitch" }));
    await screen.findByRole("alert");
    expect(screen.queryByText("Projeção de receita mensal")).not.toBeInTheDocument();
  });
  it("não solicita conteúdo quando a conta não possui acesso", () => {
    mocks.allowed = false;
    render(page());
    expect(screen.getByLabelText("Senha do pitch")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Abrir pitch" })).toBeDisabled();
    expect(mocks.call).not.toHaveBeenCalled();
    expect(screen.queryByText(buildPitchContent().brandPositioning)).not.toBeInTheDocument();
  });
  it("remove conteúdo ao trocar de conta", async () => {
    mocks.call.mockResolvedValue({ content: buildPitchContent(), expiresInSeconds: 900 });
    const view = render(page());
    fireEvent.change(screen.getByLabelText("Senha do pitch"), { target: { value: "synthetic-test-input" } });
    fireEvent.click(screen.getByRole("button", { name: "Abrir pitch" }));
    await screen.findByText("Projeção de receita mensal");
    mocks.userId = "other-test-user";
    view.rerender(page());
    await waitFor(() => expect(screen.queryByText("Projeção de receita mensal")).not.toBeInTheDocument());
  });
});