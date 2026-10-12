import { useEffect, useState } from "react";
import { BellRing, BriefcaseBusiness, Crown, MapPin, Megaphone, TrendingUp, Users, Workflow, ArrowRight, ShieldCheck, Smartphone, Layers3, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PitchChapter } from "./PitchChapter";
import { CorporatePillars } from "./CorporatePillars";
import type { PitchContent } from "./types";
import { InstitutionalCredits } from "@/components/layout/InstitutionalCredits";

const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
type Scenario = PitchContent["scenarios"][number];
const rows: { label: string; value: (s: Scenario) => string | number; emphasis?: boolean }[] = [
  { label: "Regiões atendidas", value: (s) => s.regions },
  { label: "Espaços de 30 dias", value: (s) => s.placements },
  { label: "Patrocínios de 7 dias / mês", value: (s) => s.events },
  { label: "Disparos regionais de push / mês", value: (s) => s.pushes },
  { label: "Receita de espaços", value: (s) => money(s.placementRevenue) },
  { label: "Receita de patrocínios", value: (s) => money(s.eventRevenue) },
  { label: "Receita de pushes patrocinados", value: (s) => money(s.pushRevenue) },
  { label: "Receita bruta mensal", value: (s) => money(s.revenue), emphasis: true },
  { label: "Investimento em marketing", value: (s) => money(s.marketing) },
  { label: "Receita após marketing*", value: (s) => money(s.afterMarketing) },
];

export function PitchContentView({ content: sourceContent }: { content: PitchContent }) {
  const content: PitchContent = {
    ...sourceContent,
    brandPositioning: "O Coé a Boa? é o app PWA de curadoria de eventos e publicidade hiperlocal no Rio de Janeiro. Conecta público, produtores e negócios aos rolês de cada região.",
    technology: sourceContent.technology && { ...sourceContent.technology, description: "Abre pelo navegador, sem loja de aplicativos, com opção de fixar na tela inicial. Agenda atualizada, login e envios exigem conexão." },
    projectionBasis: "Projeção conservadora por praça, baseada em espaços profissionais e patrocínios — não em taxas simbólicas de lançamento.",
    projectionRegional: "Receita local com espaços de 30 dias e patrocínios de eventos de 7 dias. Expansão conforme vendas e validação de cada praça.",
    projectionGlobal: "A tabela consolida 1, 3 e 6 regiões nas fases previstas. São totais, não valores por praça; o resultado depende das vendas e dos custos.",
    b2c: sourceContent.b2c && {
      ...sourceContent.b2c,
      organic: { ...sourceContent.b2c.organic, items: [
        { title: "Zero barreiras", description: "Um link abre a agenda. Sem instalação obrigatória para descobrir os rolês." },
        { title: "Boca a boca e comunidade", description: "Produtores, páginas de bairro e micro-influenciadores compartilham eventos no WhatsApp e nas redes." },
        { title: "QR codes locais", description: "Cartazes e pontos parceiros autorizados conectam o público à programação." },
      ] },
      paid: { ...sourceContent.b2c.paid, items: [
        { title: "Geolocalização", description: "Testar Meta Ads e TikTok por bairro ou raio. Conferir a origem do público antes de ampliar a verba." },
        { title: "Co-marketing local", description: "Campanhas com produtores e comerciantes da praça, usando eventos reais e convites diretos." },
        { title: "Medir e ajustar", description: "Comparar custo por visita, contato e anunciante conquistado. Escalar o que funcionar." },
      ] },
    },
    b2b: sourceContent.b2b && {
      ...sourceContent.b2b,
      exclusivity: { ...sourceContent.b2b.exclusivity, description: "Abordagem direta ao comércio local: visibilidade no bairro e proposta de exclusividade visual Master/Sub-Master na abertura do app. Medir visitas, contatos e vendas atribuíveis à campanha, quando houver dados; com acompanhamento mensal." },
      anchors: { ...sourceContent.b2b.anchors, description: "Captar um Master e dois Sub-Masters por praça, com proposta clara e acompanhamento mensal.", steps: [
        { title: "Selecionar parceiros locais", description: "Priorizar negócios e produtores alinhados ao público do bairro." },
        { title: "Apresentar uma proposta objetiva", description: "Definir região, espaço, período, entregas e preço." },
        { title: "Fechar e acompanhar", description: "Confirmar pagamento e aprovação. Avaliar resultados para renovar." },
      ] },
    },
  };
  const [activeChapter, setActiveChapter] = useState("overview");
  const [destination, setDestination] = useState<string | null>(null);
  useEffect(() => {
    if (!destination) return;
    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(destination);
      if (!target) return;
      for (let parent = target.parentElement; parent; parent = parent.parentElement) {
        if (parent instanceof HTMLDetailsElement) parent.open = true;
      }
      target.focus({ preventScroll: true });
      target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      setDestination(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [destination, activeChapter]);
  const shortcut = (windowId: string, targetId: string, label: string) => <Button key={targetId} asChild variant="outline" size="sm" className="h-auto min-h-11 max-w-full whitespace-normal text-left"><a href={`#${targetId}`} onClick={(event) => {
    event.preventDefault();
    setActiveChapter(windowId);
    setDestination(targetId);
  }}><ArrowRight aria-hidden="true" /><span>{label}</span></a></Button>;
  const navigation = (windowId: string, label: string, items: { id: string; label: string }[]) => <nav aria-label={label} className="flex flex-wrap gap-2 border-b border-border pb-5">{items.map((item) => shortcut(windowId, item.id, item.label))}</nav>;
  const headingClass = "scroll-mt-24 text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const event = content.formats[0];
  const regional = content.formats[1];
  const chapters = [
    { value: "overview", label: "Visão Geral" },
    { value: "product", label: "Receita & Setores" },
    { value: "b2c", label: "Marketing B2C" },
    { value: "b2b", label: "Comercial B2B" },
    { value: "next-steps", label: "Lançamento & Expansão" },
    { value: "singularity", label: "Por que Investir" },
  ];
  return <div className="min-w-0">
    <Tabs value={activeChapter} onValueChange={setActiveChapter} className="min-w-0">
      <TabsList aria-label="Capítulos do pitch" className="grid w-full grid-cols-2 gap-1 rounded-none border-b border-border bg-transparent p-0 pb-3 sm:grid-cols-3 lg:grid-cols-6">
        {chapters.map((chapter) => <TabsTrigger key={chapter.value} value={chapter.value} className="min-w-0 whitespace-normal px-3 py-3 text-center leading-snug data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">{chapter.label}</TabsTrigger>)}
      </TabsList>
      <TabsContent value="overview" className="min-w-0 space-y-10 pt-8">
        <section aria-labelledby="pitch-overview" className="space-y-5">
          <p className="text-xs font-medium uppercase text-primary">Coé a Boa? · Visão executiva</p>
          <h2 id="pitch-overview" className="max-w-3xl text-3xl font-semibold leading-tight">Visão Geral e Qualidades do Ecossistema</h2>
          <p className="max-w-2xl leading-relaxed text-muted-foreground">Descoberta de lazer, divulgação e gestão comercial no mesmo lugar. Um ecossistema hiperlocal que conecta público, produtores e negócios no Rio de Janeiro.</p>
          <ul className="grid gap-4 sm:grid-cols-2">{[
            { title: "Segurança e Governança", description: "Anti-duplicidade, cotas e revisão antes da publicação.", icon: ShieldCheck },
            { title: "Ferramentas Administrativas e Financeiras", description: "Gestão integrada de eventos, anúncios e finanças, com acesso por perfil.", icon: BriefcaseBusiness },
            { title: "Usabilidade Premium", description: "Mobile-first, cadastro por flyer e compartilhamento viral.", icon: Smartphone },
            { title: "Escalabilidade", description: "Expansão planejada a partir da Ilha do Governador, após validação do piloto.", icon: Layers3 },
          ].map(({ title, description, icon: Icon }) => <li key={title} className="min-w-0 space-y-4 rounded-lg border border-border bg-card p-6"><Icon aria-hidden="true" className="h-5 w-5 text-primary" /><div className="space-y-2"><h3 className="text-lg font-semibold">{title}</h3><p className="text-sm leading-relaxed text-muted-foreground">{description}</p></div></li>)}</ul>
        </section>
        <CorporatePillars />
      </TabsContent>
    <PitchChapter value="product" number="01" title="Modelo de Receita & Setores" eyebrow="Produto · Monetização" icon={BriefcaseBusiness}>

        <CorporatePillars />
        <section className="space-y-3"><h3 id="pitch-product" tabIndex={-1} className={`${headingClass} text-2xl`}>Coé a Boa?</h3><p className="max-w-3xl leading-relaxed text-muted-foreground">{content.brandPositioning}</p></section>
        {content.technology && <section className="space-y-3 border-t border-border pt-6"><h3 id="pitch-technology" tabIndex={-1} className={headingClass}>{content.technology.title}</h3><p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{content.technology.description}</p></section>}
        <section className="space-y-5 border-t border-border pt-6">
          <h3 id="pitch-formats" tabIndex={-1} className="scroll-mt-24 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-2 text-xl font-semibold"><Megaphone className="h-5 w-5 shrink-0 text-primary" /> Inventário e Condições dos Formatos</h3>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-4"><h4 className="flex items-center gap-2 font-semibold"><Crown className="h-4 w-4 text-primary" /> Espaços Publicitários Fixos</h4><p className="text-sm leading-relaxed text-muted-foreground">Um Master e dois Sub-Masters, com cobrança mensal. Exclusividade visual proposta na abertura do app, sem rotação automática.</p>
              <dl className="space-y-3">{content.anchor.tiers.map((tier) => <div key={tier.title} className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-t border-border pt-3"><dt className="text-sm font-medium">{tier.slots} {tier.title}</dt><dd className="text-sm font-semibold text-primary">{money(tier.min)} a {money(tier.max)}<span className="font-normal text-muted-foreground"> /mês{tier.slots > 1 ? " cada" : ""}</span></dd></div>)}</dl>
              <p className="text-xs leading-relaxed text-muted-foreground">Potencial mensal das três cotas: {money(content.anchor.monthlyMin)} a {money(content.anchor.monthlyMax)}/mês, se contratadas. Não incluído na tabela abaixo.</p>
            </div>
            {event && <div className="space-y-4"><h4 className="font-semibold">Patrocínio de Eventos</h4><p className="text-sm leading-relaxed text-muted-foreground">Patrocínio de 7 dias para destacar o rolê, respeitando região, categoria e data.</p><p className="border-t border-border pt-3 text-lg font-semibold text-primary">{money(event.min)} a {money(event.max)} <span className="text-sm font-normal text-muted-foreground">· {event.cycle}</span></p><p className="text-sm leading-relaxed text-muted-foreground">{event.description}</p></div>}
          </div>
        </section>
        <section className="min-w-0 space-y-4 border-t border-border pt-6">
          <h3 id="pitch-projection" tabIndex={-1} className="scroll-mt-24 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-2 text-xl font-semibold"><TrendingUp className="h-5 w-5 shrink-0 text-primary" /> Projeção de receita mensal</h3>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{content.projectionBasis}</p>
          {content.projectionRegional && <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground"><strong className="font-medium text-foreground">Por praça:</strong> {content.projectionRegional}</p>}
          <p className="text-sm text-muted-foreground">Cenários consolidados de 1, 3 e 6 regiões · meses 1, 6 e 12.</p>
          <div className="w-full overflow-x-auto rounded-lg border border-primary/30 bg-card" tabIndex={0} aria-label="Projeção mensal por período"><table className="w-full min-w-[620px] text-left text-sm"><caption className="sr-only">Cenário ilustrativo de vendas e receita dos meses 1, 6 e 12</caption><thead className="bg-primary/10"><tr><th scope="col" className="p-4 font-medium">Vendas e receita</th>{content.scenarios.map((s) => <th scope="col" key={s.month} className="p-4 font-medium"><span className="block">{s.phase}</span><span className="text-xs text-muted-foreground">Mês {s.month}</span></th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.label} className={row.emphasis ? "border-t border-border bg-primary/10 text-primary" : "border-t border-border"}><th scope="row" className="p-4 font-medium">{row.label}</th>{content.scenarios.map((s) => <td key={s.month} className="whitespace-nowrap p-4 tabular-nums">{row.value(s)}</td>)}</tr>)}</tbody></table></div>
          <p className="text-xs leading-relaxed text-muted-foreground">* {content.disclaimer}</p>
        </section>
        <details className="group border-t border-border pt-5"><summary className="cursor-pointer text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Inventário e condições dos formatos</summary><div className="mt-5 space-y-6">
          {content.inventoryImage && <figure className="space-y-3"><h3 id="pitch-inventory-map" tabIndex={-1} className={headingClass}>Mapa de Inventário Publicitário</h3><img src={content.inventoryImage} alt="Layout conceitual do Coé a Boa?: Master no topo, dois co-patrocinadores abaixo, carrossel regional, banners nativos na Agenda, eventos patrocinados e notificações regionais." width={1536} height={1024} loading="lazy" decoding="async" className="h-auto w-full rounded-lg border border-border" /><figcaption className="text-xs leading-relaxed text-muted-foreground">Ilustração conceitual com marcas fictícias. Os formatos representados não confirmam sua ativação; Master e Sub-Master seguem a proposta de exclusividade por sessão, sem rotação automática.</figcaption></figure>}
          <section className="space-y-3"><h3 id="pitch-regional-ads" tabIndex={-1} className="scroll-mt-24 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-2 text-lg font-semibold"><MapPin className="h-4 w-4 text-primary" /> Publicidade regional</h3><p className="text-sm leading-relaxed text-muted-foreground">{content.differential}</p>{regional && <p className="text-sm leading-relaxed text-muted-foreground">{regional.title}: {money(regional.min)} a {money(regional.max)} · {regional.cycle}.</p>}<p className="text-sm leading-relaxed text-muted-foreground">{content.capacity}</p><p className="text-sm leading-relaxed text-muted-foreground">{content.monetization}</p></section>
          <section className="space-y-3 border-t border-border pt-5"><h3 id="pitch-push" tabIndex={-1} className="scroll-mt-24 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-2 text-lg font-semibold"><BellRing className="h-4 w-4 text-primary" /> {content.push.title}</h3><p className="text-sm leading-relaxed text-muted-foreground">{content.push.example}</p><p className="text-sm font-medium">{money(content.pushTicket)} por disparo regional · {content.push.packageSends} disparos/mês por {money(content.push.packagePrice)}</p></section>
          <section className="space-y-4 border-t border-border pt-5"><h3 id="pitch-anchor" tabIndex={-1} className={headingClass}>{content.anchor.title}</h3><p className="text-sm leading-relaxed text-muted-foreground">{content.anchor.billing}</p><div className="grid gap-5 md:grid-cols-2"><div><h4 className="text-sm font-semibold">Banner âncora prioritário na Home</h4><p className="mt-2 text-sm text-muted-foreground">{content.anchor.banner}</p></div><div><h4 className="text-sm font-semibold">Contagem regressiva para o evento</h4><p className="mt-2 text-sm text-muted-foreground">{content.anchor.countdown}</p></div></div><ol className="grid gap-5 md:grid-cols-3">{content.anchor.phases.map((phase, i) => <li key={phase.title}><h4 className="text-sm font-semibold"><span className="mr-2 text-primary">0{i + 1}</span>{phase.title}</h4><p className="mt-2 text-sm text-muted-foreground">{phase.description}</p></li>)}</ol></section>
        </div></details>
    </PitchChapter>
    <PitchChapter value="b2c" number="02" title="Plano de Marketing (Atração de Usuários - B2C)" eyebrow="B2C · Público" icon={Users}>
{content.b2c && <>{navigation("b2c", "Atalhos do Plano de Marketing", [{ id: "pitch-paid-strategy", label: "Estratégia Paga · Aceleração e Escala" }])}<div className="grid gap-8 md:grid-cols-2">{[content.b2c.organic, content.b2c.paid].map((strategy, i) => <section key={strategy.title} className="space-y-5"><h3 id={i === 1 ? "pitch-paid-strategy" : "pitch-organic-strategy"} tabIndex={-1} className="scroll-mt-24 text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{strategy.title}</h3><ul className="space-y-4">{strategy.items.map((item) => <li key={item.title} className="space-y-1.5 border-t border-border pt-4"><h4 className="text-sm font-semibold">{item.title}</h4><p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p></li>)}</ul>{i === 1 && <p className="border-l-2 border-primary pl-4 text-sm">Verba inicial estimada: <strong className="text-primary">{money(content.marketingMin)} a {money(content.marketingMax)}/mês</strong></p>}</section>)}</div></>}
    </PitchChapter>
    <PitchChapter value="b2b" number="03" title="Plano Comercial (Vendas B2B e Abordagem)" eyebrow="B2B · Anunciantes" icon={BriefcaseBusiness}>
{content.b2b && <><section className="space-y-3"><h3 id="pitch-sales-argument" tabIndex={-1} className={headingClass}>{content.b2b.exclusivity.title}</h3><p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{content.b2b.exclusivity.description}</p></section><section className="space-y-5 border-t border-border pt-6"><h3 id="pitch-prospecting" tabIndex={-1} className={headingClass}>Metodologia de Captação</h3><p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{content.b2b.anchors.description}</p><ol className="grid gap-6 md:grid-cols-3">{content.b2b.anchors.steps.map((step, i) => <li key={step.title} className="space-y-2"><span className="text-xs font-semibold text-primary">0{i + 1}</span><h4 className="text-sm font-semibold">{step.title}</h4><p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p></li>)}</ol></section></>}
        {content.selfService && <details className="group border-t border-border pt-5"><summary className="cursor-pointer text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Evolução futura · Autoatendimento com controle</summary><section className="mt-5 space-y-4"><h3 id="pitch-self-service" tabIndex={-1} className="scroll-mt-24 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-2 text-lg font-semibold"><Workflow className="h-4 w-4 shrink-0 text-primary" /> {content.selfService.title}</h3><p className="text-sm leading-relaxed text-muted-foreground">{content.selfService.description}</p><ol className="grid gap-5 md:grid-cols-2">{content.selfService.steps.map((step) => <li key={step.title} className="space-y-2"><h4 className="text-sm font-semibold">{step.title}</h4><p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p></li>)}</ol><p className="text-sm leading-relaxed text-muted-foreground">{content.selfService.strategy}</p></section></details>}
    </PitchChapter>
    <PitchChapter value="next-steps" number="04" title="Estratégia · Praça-piloto e Lançamento" eyebrow="Estratégia · Lançamento" icon={ArrowRight}>
      {navigation("next-steps", "Atalhos da Estratégia de Lançamento", [
        { id: "pitch-regional-expansion", label: "Plano de Expansão Regional (Fases 2 e 3)" },
        { id: "pitch-hybrid-acquisition", label: "Estratégia de Atração Híbrida" },
      ])}
      <section className="space-y-4">
        <h3 id="pitch-pilot" tabIndex={-1} className={headingClass}>O Ponto de Partida: Ilha do Governador como Praça-Piloto</h3>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">A <strong className="font-medium text-foreground">Ilha do Governador</strong> é a praça-piloto oficial. O legado do <em>AgendIlha</em> conecta o projeto a produtores, estabelecimentos e público local.</p>
        <ul className="grid gap-5 md:grid-cols-2">{[
          { title: "Vantagem Inicial", description: "Relações locais e conhecimento da região como ponto de partida." },
          { title: "Validação de Produto", description: "Ouvir o público e refinar o cadastro por flyer e a experiência de uso." },
        ].map((item) => <li key={item.title} className="space-y-2 border-t border-border pt-4"><h4 className="text-sm font-semibold">{item.title}</h4><p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p></li>)}</ul>
      </section>
      <section className="space-y-4 border-t border-border pt-6">
        <h3 id="pitch-governance" tabIndex={-1} className={headingClass}>Ecossistema de Governança e Expansão Regional</h3>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">O controle inteligente de duplicidade e as cotas — gratuito versus patrocinado — apoiam uma curadoria limpa. Revisão e horários distintos sustentam a expansão além da Ilha do Governador.</p>
        <ul className="grid gap-5 md:grid-cols-2">{[
          { title: "Facilidade para quem divulga", description: "Cadastro por flyer, revisão rápida e loop de compartilhamento viral no WhatsApp e nas redes." },
          { title: "Facilidade para quem busca lazer", description: "Uma agenda organizada para descobrir rolês locais e em regiões vizinhas." },
        ].map((item) => <li key={item.title} className="space-y-2 border-t border-border pt-4"><h4 className="text-sm font-semibold">{item.title}</h4><p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p></li>)}</ul>
      </section>
      <section className="space-y-4 border-t border-border pt-6">
        <h3 id="pitch-regional-expansion" tabIndex={-1} className="scroll-mt-24 text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Plano de Expansão Regional (Fases 2 e 3)</h3>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">Após validar tração e receita no piloto, expandir por etapas:</p>
        <ul className="grid gap-5 md:grid-cols-2">{[
          { title: "Fase de Adjacência", description: "Avançar para polos vizinhos, como Niterói." },
          { title: "Fase de Escala Metropolitana", description: "Chegar à Baixada Fluminense, como Duque de Caxias, e aos principais eixos da capital." },
        ].map((item) => <li key={item.title} className="space-y-2 border-t border-border pt-4"><h4 className="text-sm font-semibold">{item.title}</h4><p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p></li>)}</ul>
      </section>
      <section className="space-y-4 border-t border-border pt-6">
        <h3 id="pitch-hybrid-acquisition" tabIndex={-1} className="scroll-mt-24 text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Estratégia de Atração Híbrida (Go-To-Market)</h3>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">Parcerias, curadoria e mídia local para conquistar público:</p>
        <ul className="grid gap-6 md:grid-cols-3">{[
          { title: "Boca a Boca e Parcerias Locais (B2B Orgânico)", description: "Visitar bares, quiosques e organizadores; demonstrar o cadastro por flyer." },
          { title: "Conteúdo e Comunidade (B2C Orgânico)", description: "Compartilhar os melhores rolês da semana e fortalecer o hábito de consultar a agenda." },
          { title: "Tráfego Pago Hiperlocal", description: "Segmentar por geolocalização e raio de interesse; medir antes de ampliar." },
        ].map((item) => <li key={item.title} className="space-y-2 border-t border-border pt-4"><h4 className="text-sm font-semibold">{item.title}</h4><p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p></li>)}</ul>
      </section>
    </PitchChapter>
    <PitchChapter value="singularity" number="05" title="Por que Investir no Coé a Boa? (Singularidade)" eyebrow="Encerramento · Resumo executivo" icon={Sparkles}>
      <section className="space-y-3"><h3 id="pitch-investment-differential" tabIndex={-1} className={headingClass}>Diferencial do Produto</h3>
      <p className="max-w-3xl text-lg font-medium leading-relaxed">Um ecossistema seguro e inteligente para o entretenimento local.</p></section>
      <section className="space-y-3"><h3 id="pitch-investment-ecosystem" tabIndex={-1} className={headingClass}>Ecossistema Hiperlocal</h3>
      <p className="max-w-3xl leading-relaxed text-muted-foreground">Curadoria, cadastro rápido e publicidade de bairro conectam público, produtores e comerciantes. Preparado para escalar praça a praça, com governança e validação do piloto.</p></section>
      <section className="space-y-3"><h3 id="pitch-investment-opportunity" tabIndex={-1} className={headingClass}>Oportunidade e Validação</h3>
      <p className="max-w-3xl border-l-2 border-primary pl-4 text-sm leading-relaxed text-muted-foreground">Crescer no mercado de lazer local com operação enxuta, governança e resultados medidos.</p></section>
    </PitchChapter>
    </Tabs>
    <footer aria-label="Notas institucionais" className="mt-10 space-y-4 border-t border-border pt-6 text-xs leading-relaxed text-muted-foreground">
      <p>Preços sugeridos e projeções ilustrativas; não representam receita realizada nem retorno garantido. Expansão sujeita à validação da praça-piloto.</p>
      <p>Formatos, exclusividade, contagem regressiva e autoatendimento são propostas comerciais; esta apresentação não ativa campanhas, cobranças ou disparos. Push exige consentimento, segmentação e implantação.</p>
      <InstitutionalCredits />
    </footer>
  </div>;
}
