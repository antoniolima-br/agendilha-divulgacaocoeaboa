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
  it("só exibe após conferência, permite bloquear e limpa o campo", async () => {
    mocks.call.mockResolvedValue({ content: { ...buildPitchContent(), inventoryImage }, expiresInSeconds: 900 });
    render(page());
    expect(screen.queryByRole("heading", { name: "Projeção de receita mensal" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Visão Geral e Qualidades do Ecossistema" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: buildPitchContent().anchor.title })).not.toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /Layout conceitual/ })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Senha do pitch"), { target: { value: "synthetic-test-input" } });
    fireEvent.click(screen.getByRole("button", { name: "Abrir pitch" }));
    await screen.findByRole("heading", { name: "Projeção de receita mensal" });
    const overview = screen.getByRole("heading", { name: "Visão Geral e Qualidades do Ecossistema" });
    expect(overview).toBeVisible();
    for (const name of ["Segurança e Governança", "Ferramentas Administrativas e Financeiras", "Usabilidade Premium", "Escalabilidade"]) {
      expect(screen.getByRole("heading", { name })).toBeVisible();
    }
    const monetization = screen.getByRole("button", { name: /01.*O Produto e Fontes de Receita/ });
    expect(overview.compareDocumentPosition(monetization) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText(/Expansão planejada a partir/)).toHaveTextContent("após validação do piloto");
    fireEvent.click(screen.getByText("Inventário e condições dos formatos"));
    expect(screen.getByRole("img", { name: /Layout conceitual/ })).toHaveAttribute("src", inventoryImage);
    expect(screen.getByRole("heading", { name: /^Coé a Boa\?$/ })).toBeInTheDocument();
    expect(screen.getByText(buildPitchContent().monetization)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Notificações Push Regionais" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Fase de Expansão/ })).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: "Receita de pushes patrocinados" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: buildPitchContent().anchor.title })).toBeInTheDocument();
    expect(screen.getByText("1 Anunciante Master")).toBeInTheDocument();
    expect(screen.getByText("2 Sub-Masters / Co-Patrocinadores")).toBeInTheDocument();
    expect(screen.getByText(buildPitchContent().anchor.billing)).toBeInTheDocument();
    expect(screen.queryByText(/Pacote trimestral/)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Banner âncora prioritário na Home" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Contagem regressiva para o evento" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /01\s*Teaser/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /02\s*Aquecimento/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /03\s*Reta Final/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Bloquear" }));
    expect(screen.queryByRole("heading", { name: "Visão Geral e Qualidades do Ecossistema" })).not.toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /Layout conceitual/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: buildPitchContent().anchor.title })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Projeção de receita mensal" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Senha do pitch")).toHaveValue("");
  });
  it("mantém fechado quando a senha é recusada", async () => {
    mocks.call.mockRejectedValue(new Error("Senha incorreta. Confira e tente novamente."));
    render(page());
    fireEvent.change(screen.getByLabelText("Senha do pitch"), { target: { value: "synthetic-test-input" } });
    fireEvent.click(screen.getByRole("button", { name: "Abrir pitch" }));
    await screen.findByRole("alert");
    expect(screen.queryByRole("heading", { name: "Projeção de receita mensal" })).not.toBeInTheDocument();
  });
  it("abre a estratégia do piloto independentemente e mantém expansão como plano", async () => {
    mocks.call.mockResolvedValue({ content: buildPitchContent(), expiresInSeconds: 900 });
    render(page());
    expect(screen.queryByText(/O Ponto de Partida/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Senha do pitch"), { target: { value: "synthetic-test-input" } });
    fireEvent.click(screen.getByRole("button", { name: "Abrir pitch" }));
    const strategy = await screen.findByRole("button", { name: /04.*Estratégia · Praça-piloto e Lançamento/ });
    expect(strategy).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(strategy);
    expect(screen.getByRole("heading", { name: /O Ponto de Partida/ })).toBeVisible();
    expect(screen.getByText("AgendIlha")).toBeVisible();
    expect(screen.getByText(/como Niterói/)).toBeVisible();
    expect(screen.getByText(/como Duque de Caxias/)).toBeVisible();
    expect(screen.getByRole("heading", { name: /Estratégia de Atração Híbrida/ })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Ecossistema de Governança e Expansão Regional" })).toBeVisible();
    expect(screen.getByText(/controle inteligente de duplicidade/)).toHaveTextContent("gratuito versus patrocinado");
    expect(screen.getByText(/controle inteligente de duplicidade/)).toHaveTextContent("além da Ilha do Governador");
    expect(screen.getByRole("heading", { name: "Facilidade para quem divulga" })).toBeVisible();
    expect(screen.getByText(/loop de compartilhamento viral/)).toBeVisible();
    expect(screen.getByRole("heading", { name: "Facilidade para quem busca lazer" })).toBeVisible();
    expect(screen.getByText(/Uma agenda organizada/)).toHaveTextContent("regiões vizinhas");
    expect(screen.getByText(/nenhuma campanha é ativada/)).toBeVisible();
    expect(screen.getByRole("heading", { name: "Projeção de receita mensal" })).toBeVisible();
    fireEvent.click(strategy);
    expect(screen.queryByText(/O Ponto de Partida/)).not.toBeInTheDocument();
  });
  it("não solicita conteúdo quando a conta não possui acesso", () => {
    mocks.allowed = false;
    render(page());
    expect(screen.getByLabelText("Senha do pitch")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Abrir pitch" })).toBeDisabled();
    expect(mocks.call).not.toHaveBeenCalled();
    expect(screen.queryByText(/O Coé a Boa\? é o app PWA/)).not.toBeInTheDocument();
  });
  it("mantém atalhos só dentro dos blocos e navega às subseções", async () => {
    const scroll = vi.fn();
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
    const scrollMock = vi.spyOn(HTMLElement.prototype, "scrollIntoView").mockImplementation(scroll);
    try {
      mocks.call.mockResolvedValue({ content: buildPitchContent(), expiresInSeconds: 900 });
      render(page());
      expect(screen.queryByRole("navigation", { name: "Atalhos do pitch" })).not.toBeInTheDocument();
      fireEvent.change(screen.getByLabelText("Senha do pitch"), { target: { value: "synthetic-test-input" } });
      fireEvent.click(screen.getByRole("button", { name: "Abrir pitch" }));
      await screen.findByRole("heading", { name: "Projeção de receita mensal" });
      expect(screen.queryByRole("navigation", { name: "Atalhos do pitch" })).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Estratégia Paga · Aceleração e Escala" })).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /02.*Plano de Marketing/ }));
      const paid = screen.getByRole("link", { name: "Estratégia Paga · Aceleração e Escala" });
      expect(paid.closest("nav")).toHaveAttribute("aria-label", "Atalhos do Plano de Marketing");
      expect(paid).toHaveAttribute("href", "#pitch-paid-strategy");
      fireEvent.click(paid);
      await waitFor(() => expect(screen.getByRole("heading", { name: "Estratégia Paga · Aceleração e Escala" })).toHaveFocus());
      expect(scroll).toHaveBeenLastCalledWith({ behavior: "smooth", block: "start" });
      expect(screen.getByRole("navigation", { name: "Atalhos do Plano de Marketing" })).toBeVisible();
      fireEvent.click(screen.getByRole("button", { name: /04.*Estratégia · Praça-piloto e Lançamento/ }));
      const expansion = screen.getByRole("link", { name: "Plano de Expansão Regional (Fases 2 e 3)" });
      expect(expansion.closest("nav")).toHaveAttribute("aria-label", "Atalhos da Estratégia de Lançamento");
      expect(expansion).toHaveAttribute("href", "#pitch-regional-expansion");
      fireEvent.click(expansion);
      await waitFor(() => expect(screen.getByRole("heading", { name: "Plano de Expansão Regional (Fases 2 e 3)" })).toHaveFocus());
      expect(screen.getByRole("heading", { name: "Projeção de receita mensal" })).toBeVisible();
      vi.mocked(window.matchMedia).mockReturnValue({ matches: true } as MediaQueryList);
      fireEvent.click(screen.getByRole("link", { name: /^Estratégia de Atração Híbrida$/ }));
      await waitFor(() => expect(screen.getByRole("heading", { name: /Estratégia de Atração Híbrida/ })).toHaveFocus());
      expect(scroll).toHaveBeenLastCalledWith({ behavior: "auto", block: "start" });
    } finally {
      scrollMock.mockRestore();
      vi.unstubAllGlobals();
    }
  });
  it("mantém somente três âncoras contextualizadas e tópicos corridos nos demais blocos", async () => {
    const scroll = vi.fn();
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
    const scrollMock = vi.spyOn(HTMLElement.prototype, "scrollIntoView").mockImplementation(scroll);
    try {
      mocks.call.mockResolvedValue({ content: { ...buildPitchContent(), inventoryImage }, expiresInSeconds: 900 });
      render(page());
      fireEvent.change(screen.getByLabelText("Senha do pitch"), { target: { value: "synthetic-test-input" } });
      fireEvent.click(screen.getByRole("button", { name: "Abrir pitch" }));
      await screen.findByRole("heading", { name: "Projeção de receita mensal" });
      for (const number of ["02", "03", "04", "05"]) {
        fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${number}`) }));
      }
      const navigations = screen.getAllByRole("navigation");
      expect(navigations).toHaveLength(2);
      expect(within(screen.getByRole("navigation", { name: "Atalhos do Plano de Marketing" })).getAllByRole("link").map((link) => link.textContent)).toEqual(["Estratégia Paga · Aceleração e Escala"]);
      expect(within(screen.getByRole("navigation", { name: "Atalhos da Estratégia de Lançamento" })).getAllByRole("link").map((link) => link.textContent)).toEqual(["Plano de Expansão Regional (Fases 2 e 3)", "Estratégia de Atração Híbrida"]);
      expect(screen.getAllByRole("link")).toHaveLength(3);
      for (const name of ["Atalhos do Produto e Monetização", "Atalhos do Plano Comercial", "Atalhos da Singularidade"]) {
        expect(screen.queryByRole("navigation", { name })).not.toBeInTheDocument();
      }
      for (const name of ["Coé a Boa?", "Metodologia de Captação", "Diferencial do Produto", "Ecossistema Hiperlocal", "Oportunidade e Validação"]) {
        expect(screen.getByRole("heading", { name })).toBeVisible();
      }
      for (const navigation of navigations) {
        for (const link of within(navigation).getAllByRole("link")) {
          const href = link.getAttribute("href");
          expect(href).toMatch(/^#pitch-/);
          const target = document.getElementById(href?.slice(1) ?? "");
          expect(target).not.toBeNull();
          expect(navigation.parentElement?.contains(target)).toBe(true);
          fireEvent.click(link);
          await waitFor(() => expect(target).toHaveFocus());
          expect(target).toBeVisible();
          expect(scroll).toHaveBeenLastCalledWith({ behavior: "auto", block: "start" });
        }
      }
      expect(screen.queryByRole("navigation", { name: "Atalhos do pitch" })).not.toBeInTheDocument();
    } finally {
      scrollMock.mockRestore();
      vi.unstubAllGlobals();
    }
  });
  it("resume os cinco blocos sem alterar preços ou prometer retorno", async () => {
    mocks.call.mockResolvedValue({ content: buildPitchContent(), expiresInSeconds: 900 });
    render(page());
    fireEvent.change(screen.getByLabelText("Senha do pitch"), { target: { value: "synthetic-test-input" } });
    fireEvent.click(screen.getByRole("button", { name: "Abrir pitch" }));
    await screen.findByRole("heading", { name: "Projeção de receita mensal" });
    expect(screen.getByText(/O Coé a Boa\? é o app PWA/)).toHaveTextContent("Rio de Janeiro");
    expect(screen.getByRole("rowheader", { name: "Patrocínios de 7 dias / mês" })).toBeVisible();
    expect(screen.getByText(/Um Master e dois Sub-Masters/)).toHaveTextContent("cobrança mensal");
    for (const number of ["02", "03", "04", "05"]) fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${number}`) }));
    expect(screen.getByRole("heading", { name: "QR codes locais" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Co-marketing local" })).toBeVisible();
    expect(screen.getByText(/Abordagem direta ao comércio local/)).toHaveTextContent("retorno comercial não é garantido");
    expect(screen.getByText(/Curadoria, cadastro rápido/)).toHaveTextContent("validação do piloto");
    expect(screen.getByText("Um ecossistema seguro e inteligente para o entretenimento local.")).toBeVisible();
  });
  it("remove conteúdo ao trocar de conta", async () => {
    mocks.call.mockResolvedValue({ content: buildPitchContent(), expiresInSeconds: 900 });
    const view = render(page());
    fireEvent.change(screen.getByLabelText("Senha do pitch"), { target: { value: "synthetic-test-input" } });
    fireEvent.click(screen.getByRole("button", { name: "Abrir pitch" }));
    await screen.findByRole("heading", { name: "Projeção de receita mensal" });
    mocks.userId = "other-test-user";
    view.rerender(page());
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Projeção de receita mensal" })).not.toBeInTheDocument());
  });
});