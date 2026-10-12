import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { buildPitchContent } from "../../../supabase/functions/commercial-pitch/content";
import { inventoryImage } from "../../../supabase/functions/commercial-pitch/inventory-image";
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
    expect(content.scenarios.map((s) => s.revenue)).toEqual([1960, 5880, 11760]);
    expect(content.scenarios.map((s) => s.afterMarketing)).toEqual([1460, 5130, 10760]);
    expect(content.scenarios.map((s) => s.pushRevenue)).toEqual([600, 1800, 3600]);
    expect(content.scenarios.map((s) => s.phase)).toEqual(["Fase Inicial", "Fase de Expansão", "Fase Consolidada"]);
    expect(content.scenarios.every((s) => s.pushes === s.regions * content.push.packageSends)).toBe(true);
    expect(content.push.packagePrice).toBe(content.pushTicket * content.push.packageSends);
    expect(content.push.requirements).toContain("ainda sem disparos ativados");
    expect(content.anchor.tiers.map(({ slots, min, max }) => ({ slots, min, max }))).toEqual([{ slots: 1, min: 800, max: 1000 }, { slots: 2, min: 400, max: 500 }]);
    expect([content.anchor.monthlyMin, content.anchor.monthlyMax]).toEqual([1600, 2000]);
    expect(content.anchor.billing).toContain("Recorrência mensal");
    expect(content.anchor.phases.map((phase) => phase.title)).toEqual(["Teaser", "Aquecimento", "Reta Final"]);
    expect(content.formats.find((format) => format.title === "Anunciante Master")).toMatchObject({ min: 800, max: 1000, priceSuffix: "/mês" });
    expect(content.formats.find((format) => format.title === "Sub-Masters / Co-Patrocinadores")).toMatchObject({ min: 400, max: 500, priceSuffix: "/mês cada" });
    expect(content.formats.some((format) => format.cycle.includes("trimestral"))).toBe(false);
    expect(content.anchor.disclaimer).toContain("Não está somado à projeção mensal");
    expect(content.scenarios.every((s) => s.placements / s.regions === 3)).toBe(true);
    expect(content.disclaimer).toContain("não é lucro líquido");
    expect(content.brandPositioning).toContain("produto oficial");
    expect(content.brandPositioning).toContain("Rio de Janeiro");
    expect(content.monetization).toContain("venda profissional de espaços publicitários");
    expect(content.projectionBasis).toContain("não taxas simbólicas");
    expect(content.scenarios.every((s) => s.placementRevenue > s.marketing)).toBe(true);
  });
  async function unlock() {
    mocks.call.mockResolvedValue({ content: { ...buildPitchContent(), inventoryImage }, expiresInSeconds: 900 });
    fireEvent.change(screen.getByLabelText("Senha do pitch"), { target: { value: "synthetic-test-input" } });
    fireEvent.click(screen.getByRole("button", { name: "Abrir pitch" }));
    await screen.findByRole("tab", { name: "Visão Geral" });
  }
  it("abre somente após conferência e mantém um capítulo visível", async () => {
    render(page());
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    await unlock();
    expect(screen.getByRole("tab", { name: "Visão Geral" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
    expect(screen.queryByRole("heading", { name: "Projeção de receita mensal" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Segurança e Governança" })).toBeVisible();
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Receita & Setores" }));
    expect(screen.getByRole("heading", { name: "Projeção de receita mensal" })).toBeVisible();
    expect(screen.getByRole("rowheader", { name: "Receita de pushes patrocinados" })).toBeVisible();
    expect(screen.getByText("1 Anunciante Master")).toBeVisible();
    expect(screen.getByText("2 Sub-Masters / Co-Patrocinadores")).toBeVisible();
    fireEvent.click(screen.getByText("Inventário e condições dos formatos"));
    expect(screen.getByRole("img", { name: /Layout conceitual/ })).toHaveAttribute("src", inventoryImage);
    fireEvent.click(screen.getByRole("button", { name: "Bloquear" }));
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Senha do pitch")).toHaveValue("");
  });
  it("destaca cinco setores e visão consolidada sem inventar indicadores", async () => {
    render(page()); await unlock();
    for (const name of ["Comercial", "Marketing", "Administração", "Financeiro", "Desenvolvimento"]) expect(screen.getByRole("heading", { name })).toBeVisible();
    expect(screen.getByText(/Acesso restrito por setor/)).toHaveTextContent("Master e Sênior");
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Receita & Setores" }));
    expect(screen.getByRole("heading", { name: "Uma empresa. Cinco pilares integrados." })).toBeVisible();
    expect(screen.getByRole("contentinfo", { name: "Notas institucionais" })).toHaveTextContent("não representam receita realizada");
    expect(screen.getByRole("link", { name: "Limax Sistemas" })).toHaveAttribute("href", "https://limaxsistemas.online/");
  });
  it("navega ao lançamento e preserva a estratégia como plano", async () => {
    render(page()); await unlock();
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Lançamento & Expansão" }));
    expect(screen.getByRole("heading", { name: /O Ponto de Partida/ })).toBeVisible();
    expect(screen.getByText("AgendIlha")).toBeVisible();
    expect(screen.getByText(/como Niterói/)).toBeVisible();
    expect(screen.getByText(/como Duque de Caxias/)).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Projeção de receita mensal" })).not.toBeInTheDocument();
    expect(screen.getByRole("contentinfo", { name: "Notas institucionais" })).toHaveTextContent("Expansão sujeita à validação");
  });
  it("mantém somente as âncoras contextuais e respeita movimento reduzido", async () => {
    const scroll = vi.spyOn(HTMLElement.prototype, "scrollIntoView").mockImplementation(() => {});
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
    try {
      render(page()); await unlock();
      expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
      fireEvent.mouseDown(screen.getByRole("tab", { name: "Marketing B2C" }));
      const nav = screen.getByRole("navigation", { name: "Atalhos do Plano de Marketing" });
      expect(within(nav).getAllByRole("link")).toHaveLength(1);
      fireEvent.click(within(nav).getByRole("link"));
      await waitFor(() => expect(screen.getByRole("heading", { name: "Estratégia Paga · Aceleração e Escala" })).toHaveFocus());
      expect(scroll).toHaveBeenLastCalledWith({ behavior: "auto", block: "start" });
      fireEvent.mouseDown(screen.getByRole("tab", { name: "Lançamento & Expansão" }));
      expect(within(screen.getByRole("navigation", { name: "Atalhos da Estratégia de Lançamento" })).getAllByRole("link")).toHaveLength(2);
      fireEvent.mouseDown(screen.getByRole("tab", { name: "Comercial B2B" }));
      expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
      fireEvent.mouseDown(screen.getByRole("tab", { name: "Por que Investir" }));
      expect(screen.getByRole("heading", { name: "Diferencial do Produto" })).toBeVisible();
      expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    } finally { scroll.mockRestore(); vi.unstubAllGlobals(); }
  });
  it("não solicita conteúdo sem autorização", () => {
    mocks.allowed = false; render(page());
    expect(screen.getByLabelText("Senha do pitch")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Abrir pitch" })).toBeDisabled();
    expect(mocks.call).not.toHaveBeenCalled();
  });
  it("mantém fechado se a senha for recusada", async () => {
    mocks.call.mockRejectedValue(new Error("Senha incorreta. Confira e tente novamente.")); render(page());
    fireEvent.change(screen.getByLabelText("Senha do pitch"), { target: { value: "synthetic-test-input" } });
    fireEvent.click(screen.getByRole("button", { name: "Abrir pitch" }));
    await screen.findByRole("alert");
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });
  it("remove os capítulos ao trocar de conta", async () => {
    const view = render(page()); await unlock(); mocks.userId = "other-test-user"; view.rerender(page());
    await waitFor(() => expect(screen.queryByRole("tablist")).not.toBeInTheDocument());
  });
});
