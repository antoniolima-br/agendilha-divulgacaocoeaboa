import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { buildPitchContent } from "../../../supabase/functions/commercial-pitch/content";
import { inventoryImage } from "../../../supabase/functions/commercial-pitch/inventory-image";
import AdminPitchComercial from "../AdminPitchComercial";
import { PitchContentView } from "./PitchContentView";

const mocks = vi.hoisted(() => ({ call: vi.fn() }));
vi.mock("@/lib/edge", () => ({ callPublicEdge: mocks.call }));
vi.mock("@/data/useAppSettings", () => ({ SETTING_KEYS: { teamWhatsapp: "team_whatsapp" }, settingOr: () => "21998554322", useAppSettings: () => ({ data: {} }) }));
const page = (audience: "investor" | "advertiser" = "investor") => <MemoryRouter><HelmetProvider><AdminPitchComercial audience={audience} /></HelmetProvider></MemoryRouter>;

describe("pitch comercial", () => {
  beforeEach(() => { mocks.call.mockReset(); });
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
  async function openInvestor(heading = "Conectando Pessoas, Comércios e a Energia do Rio de Janeiro.") {
    mocks.call.mockResolvedValue({ content: { ...buildPitchContent(), inventoryImage }, expiresInSeconds: 900 });
    render(page());
    await screen.findByRole("heading", { name: heading });
  }
  it("abre diretamente e apresenta capítulos em sequência", async () => {
    await openInvestor();
    expect(mocks.call).toHaveBeenCalledWith("commercial-pitch", { audience: "investor" }, expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(screen.getByRole("heading", { level: 1, name: "Coé a Boa? | Visão de Negócio & Futuro" })).toBeVisible();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(6);
    expect(screen.getByRole("heading", { name: "O Poder da Vizinhança (Hiperlocalidade)" })).toBeVisible();
    await waitFor(() => expect(screen.getByRole("button", { name: "Baixar a Apresentação em PDF" })).toBeEnabled());
    expect(screen.getAllByRole("button", { name: "Baixar a Apresentação em PDF" })).toHaveLength(1);
    expect(screen.queryByRole("link", { name: "WhatsApp" })).not.toBeInTheDocument();
    expect(screen.getByText("Projeção de receita mensal")).not.toBeVisible();
    fireEvent.click(within(screen.getByRole("region", { name: "Negócio, Produto e Receita" })).getByText("Ver detalhes"));
    expect(screen.getByRole("heading", { name: "Projeção de receita mensal" })).toBeVisible();
    expect(screen.getByRole("rowheader", { name: "Receita de pushes patrocinados" })).toBeVisible();
    expect(screen.getByText("1 Anunciante Master")).toBeVisible();
    expect(screen.getByText("2 Sub-Masters / Co-Patrocinadores")).toBeVisible();
    expect(screen.getByRole("img", { name: /Layout conceitual/ })).toHaveAttribute("src", inventoryImage);
    expect(screen.queryByLabelText("Senha do pitch")).not.toBeInTheDocument();
  });
  it("destaca cinco setores e visão consolidada sem inventar indicadores", async () => {
    await openInvestor();
    for (const name of ["Curadoria & Moderação", "Marketing", "Comercial", "Financeiro", "Desenvolvimento & Inovação"]) expect(screen.getByRole("heading", { name })).toBeVisible();
    expect(screen.getByText(/Acesso restrito por setor/)).toHaveTextContent("Master e Sênior");
    fireEvent.click(within(screen.getByRole("region", { name: "Negócio, Produto e Receita" })).getByText("Ver detalhes"));
    expect(screen.getByRole("heading", { name: "Governança e Organização Corporativa" })).toBeVisible();
    expect(screen.getByRole("contentinfo", { name: "Notas institucionais" })).toHaveTextContent("não representam receita realizada");
    expect(screen.queryByRole("link", { name: "Limax Sistemas" })).not.toBeInTheDocument();
    expect(screen.queryByText("Coé a Boa? — empresa proprietária do ecossistema e do aplicativo.")).not.toBeInTheDocument();
  });
  it("navega ao lançamento e preserva a estratégia como plano", async () => {
    await openInvestor();
    expect(screen.getByRole("heading", { name: /O Ponto de Partida/ })).toBeVisible();
    expect(screen.getByText("AgendIlha")).toBeVisible();
    expect(screen.getByText(/como Niterói/)).not.toBeVisible();
    fireEvent.click(within(screen.getByRole("region", { name: "Estratégia de Lançamento e Expansão Regional" })).getByText("Ver detalhes"));
    expect(screen.getByText(/como Niterói/)).toBeVisible();
    expect(screen.getByText(/como Duque de Caxias/)).toBeVisible();
    expect(screen.getByText("Projeção de receita mensal")).not.toBeVisible();
    expect(screen.getByRole("contentinfo", { name: "Notas institucionais" })).toHaveTextContent("Expansão sujeita à validação");
  });
  it("mantém somente as âncoras contextuais e respeita movimento reduzido", async () => {
    const scroll = vi.spyOn(HTMLElement.prototype, "scrollIntoView").mockImplementation(() => {});
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
    try {
      await openInvestor();
      expect(screen.getAllByRole("navigation")).toHaveLength(1);
      const nav = screen.getByRole("navigation", { name: "Atalhos do Plano de Marketing" });
      expect(within(nav).getAllByRole("link")).toHaveLength(1);
      fireEvent.click(within(nav).getByRole("link"));
      await waitFor(() => expect(screen.getByRole("heading", { name: "Estratégia Paga · Aceleração e Escala" })).toHaveFocus());
      expect(scroll).toHaveBeenLastCalledWith({ behavior: "auto", block: "start" });
      fireEvent.click(within(screen.getByRole("region", { name: "Estratégia de Lançamento e Expansão Regional" })).getByText("Ver detalhes"));
      expect(screen.getByRole("heading", { name: "Plano de Expansão Regional (Fases 2 e 3)" })).toBeVisible();
      fireEvent.click(within(screen.getByRole("region", { name: "Estratégia de Lançamento e Expansão Regional" })).getByText("Recolher detalhes"));
      expect(screen.getAllByRole("navigation")).toHaveLength(1);
      expect(screen.getByRole("heading", { name: "Estratégia de Atração Híbrida (Go-To-Market)" })).not.toBeVisible();
      expect(screen.getByRole("heading", { name: "Muito Além do Resultado: O Propósito de Construir Juntos" })).toBeVisible();
    } finally { scroll.mockRestore(); vi.unstubAllGlobals(); }
  });
  it("mantém resumos visíveis e detalhes fechados nos cinco blocos, com abertura e recolhimento", () => {
    render(<PitchContentView content={buildPitchContent()} />);
    const chapters = [
      { tab: "Negócio, Produto e Receita", summary: "Coé a Boa?", detail: "Projeção de receita mensal" },
      { tab: "Plano de Marketing · B2C & Aceleração", summary: "Comunidade primeiro, mídia local para acelerar", detail: "Estratégia Orgânica · Zero Barreiras" },
      { tab: "Plano Comercial · Abordagem B2B", summary: "Visibilidade de bairro, resultados acompanhados", detail: "Metodologia de Captação" },
      { tab: "Estratégia de Lançamento e Expansão Regional", summary: "O Ponto de Partida: Ilha do Governador como Praça-Piloto", detail: "Ecossistema de Governança e Expansão Regional" },
      { tab: "Conclusão · Propósito e Futuro", summary: "Muito Além do Resultado: O Propósito de Construir Juntos", detail: "Oportunidade e Validação" },
    ];
    for (const chapter of chapters) {
      const region = within(screen.getByRole("region", { name: chapter.tab }));
      expect(screen.getByRole("heading", { name: chapter.summary })).toBeVisible();
      const details = region.getByText("Ver detalhes").closest("details");
      expect(details).not.toHaveAttribute("open");
      expect(screen.getByText(chapter.detail)).not.toBeVisible();
      fireEvent.click(region.getByText("Ver detalhes"));
      expect(details).toHaveAttribute("open");
      expect(screen.getByRole("heading", { name: chapter.detail })).toBeVisible();
      fireEvent.click(region.getByText("Recolher detalhes"));
      expect(details).not.toHaveAttribute("open");
      expect(screen.getByText(chapter.detail)).not.toBeVisible();
    }
  });
  it("apresenta automação, prova de valor e parceria sem prometer ROI ou presença", () => {
    render(<PitchContentView content={buildPitchContent()} />);
    expect(screen.getByRole("heading", { name: "Coezinho · Tecnologia e Automação Inteligente" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Inteligência de Dados · Prova de Valor e ROI" })).toBeVisible();
    expect(screen.getByText(/ROI exige receita atribuível/)).toHaveTextContent("não retorno financeiro exato");
    expect(screen.getByText(/Listas de convidados e status/)).toHaveTextContent("não comprova presença");
    expect(screen.queryByRole("link", { name: /Quero patrocinar/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Cortesias e permutas ficam separadas/)).toBeVisible();
  });
  it("separa os públicos sem expor projeções na vitrine", async () => {
    const { formats, pushTicket, push } = buildPitchContent();
    mocks.call.mockResolvedValue({ content: { formats, pushTicket, push }, expiresInSeconds: 900 });
    render(page("advertiser"));
    await screen.findByRole("heading", { name: "Anuncie no Coé a Boa?" });
    expect(mocks.call).toHaveBeenCalledWith("commercial-pitch", { audience: "advertiser" }, expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(screen.queryByLabelText("Senha do pitch")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar ao app" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("heading", { name: "Conectando Pessoas, Comércios e a Energia do Rio de Janeiro." })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Projeção de receita mensal" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Governança e Organização Corporativa" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Quero patrocinar/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Divulgar meu evento/ })).not.toBeInTheDocument();
    expect(screen.queryByText("Confirme e acompanhe")).not.toBeInTheDocument();
    expect(screen.queryByText(/Publicação paga exige pagamento comprovado/)).not.toBeInTheDocument();
    expect(screen.queryByText("Ver detalhes")).not.toBeInTheDocument();
    expect(screen.getByText(/Aberturas não são pessoas únicas/)).toBeVisible();
    const sales = screen.getAllByRole("link", { name: /Fale com o Comercial no WhatsApp/ });
    expect(sales).toHaveLength(1);
    expect(sales[0].getAttribute("href")).toContain("wa.me/5521998554322");
    expect(screen.getByText(/Público interessado em lazer/)).toBeVisible();
    expect(screen.queryByText(/alto poder aquisitivo/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ROI incomparável/i)).not.toBeInTheDocument();
    expect(screen.getByText(/R\$\s*800,00 a R\$\s*1.000,00/)).toBeVisible();
    expect(screen.queryByRole("link", { name: "WhatsApp" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Copiar/ })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: "Baixar a Apresentação em PDF" })).toBeEnabled());
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getAllByRole("link")).toHaveLength(2);
    const article = screen.getByRole("article", { name: "Apresentação para anunciantes e divulgadores" });
    expect(article.querySelectorAll("section button, section a, summary")).toHaveLength(0);
    expect(within(article.querySelector("footer") as HTMLElement).getByRole("link", { name: /Fale com o Comercial/ })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Bloquear" })).not.toBeInTheDocument();
  });

  it("não reaproveita conteúdo de anunciantes para sócios", async () => {
    mocks.call.mockResolvedValueOnce({ content: { formats: buildPitchContent().formats, pushTicket: 150, push: buildPitchContent().push } }).mockResolvedValueOnce({ content: buildPitchContent() });
    const view = render(page("advertiser"));
    await screen.findByRole("heading", { name: "Anuncie no Coé a Boa?" });
    view.rerender(page("investor"));
    await screen.findByRole("heading", { name: "Conectando Pessoas, Comércios e a Energia do Rio de Janeiro." });
    expect(screen.queryByLabelText("Senha do pitch")).not.toBeInTheDocument();
  });

  it("permite tentar novamente após falha ao abrir anunciantes", async () => {
    mocks.call.mockRejectedValueOnce(new Error("Não deu para abrir. Tente novamente."));
    render(page("advertiser")); await screen.findByRole("alert");
    mocks.call.mockResolvedValue({ content: buildPitchContent(), expiresInSeconds: 900 });
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    await screen.findByRole("heading", { name: "Anuncie no Coé a Boa?" });
  });

});
