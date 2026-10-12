import { useEffect, useState } from "react";
import { BellRing, BriefcaseBusiness, Crown, MapPin, Megaphone, TrendingUp, Users, Workflow, ArrowRight, Target, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion } from "@/components/ui/accordion";
import { PitchWindow } from "./PitchWindow";
import type { PitchContent } from "./types";

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

export function PitchContentView({ content }: { content: PitchContent }) {
  const [openWindows, setOpenWindows] = useState<string[]>(["product"]);
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
  }, [destination, openWindows]);
  const shortcut = (windowId: string, targetId: string, label: string) => <Button key={targetId} asChild variant="outline" size="sm" className="h-auto min-h-11 max-w-full whitespace-normal text-left"><a href={`#${targetId}`} onClick={(event) => {
    event.preventDefault();
    setOpenWindows((current) => current.includes(windowId) ? current : [...current, windowId]);
    setDestination(targetId);
  }}><ArrowRight aria-hidden="true" /><span>{label}</span></a></Button>;
  const navigation = (windowId: string, label: string, items: { id: string; label: string }[]) => <nav aria-label={label} className="flex flex-wrap gap-2 border-b border-border pb-5">{items.map((item) => shortcut(windowId, item.id, item.label))}</nav>;
  const headingClass = "scroll-mt-24 text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const event = content.formats[0];
  const regional = content.formats[1];
  return <div className="space-y-6">
    <section aria-labelledby="pitch-overview" className="space-y-5 border-b border-border pb-6">
      <h2 id="pitch-overview" className="text-2xl font-semibold">Visão Geral e Qualidades do Ecossistema</h2>
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">O Coé a Boa? reúne descoberta de lazer, cadastro de eventos e gestão comercial em um ecossistema pensado para facilitar a vida de quem divulga e de quem procura um rolê.</p>
      <ul className="grid gap-6 md:grid-cols-2">{[
        { title: "Segurança e Governança", description: "Controle automatizado anti-duplicidade, gestão de cotas gratuitas e patrocinadas e alertas de revisão ajudam a evitar spam e envios repetidos. A moderação antes da publicação mantém a agenda organizada, com decisões reservadas à equipe autorizada." },
        { title: "Ferramentas Administrativas e Financeiras", description: "Um painel integra as ferramentas da equipe, com controle Master e acesso conforme as permissões de cada perfil. Dados estruturados apoiam campanhas de divulgação, gestão de planos para eventos pagos, acompanhamento financeiro e áreas dedicadas a anúncios patrocinados." },
        { title: "Usabilidade Premium", description: "Uma experiência fluida, pensada primeiro para o celular, com cadastro rápido por flyer e revisão editável. O compartilhamento do link no WhatsApp e nas redes sociais transforma cada produtor cultural em um potencial canal orgânico de aquisição, conectando sua audiência a outros rolês." },
        { title: "Escalabilidade", description: "A arquitetura regional e os controles de governança dão suporte à expansão da praça-piloto, Ilha do Governador, para novas regiões metropolitanas. A base está preparada para crescer; a validação de tração, receita e usabilidade na praça-piloto orienta cada nova etapa, sem tratar a expansão como já concluída." },
      ].map((quality) => <li key={quality.title} className="min-w-0 space-y-2 border-t border-border pt-4"><h3 className="text-lg font-semibold">{quality.title}</h3><p className="text-sm leading-relaxed text-muted-foreground">{quality.description}</p></li>)}</ul>
    </section>
    <Accordion type="multiple" value={openWindows} onValueChange={setOpenWindows} className="space-y-4">
    <PitchWindow value="product" number="01" title="O Produto e Fontes de Receita (Monetização)" eyebrow="Produto · Monetização" icon={BriefcaseBusiness}>

        <section className="space-y-3"><h3 id="pitch-product" tabIndex={-1} className={`${headingClass} text-2xl`}>Coé a Boa?</h3><p className="max-w-3xl leading-relaxed text-muted-foreground">{content.brandPositioning}</p></section>
        {content.technology && <section className="space-y-3 border-t border-border pt-6"><h3 id="pitch-technology" tabIndex={-1} className={headingClass}>{content.technology.title}</h3><p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{content.technology.description}</p></section>}
        <section className="space-y-5 border-t border-border pt-6">
          <h3 id="pitch-formats" tabIndex={-1} className="scroll-mt-24 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-2 text-xl font-semibold"><Megaphone className="h-5 w-5 shrink-0 text-primary" /> Inventário e Condições dos Formatos</h3>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-4"><h4 className="flex items-center gap-2 font-semibold"><Crown className="h-4 w-4 text-primary" /> Espaços Publicitários Fixos</h4><p className="text-sm leading-relaxed text-muted-foreground">Master e Sub-Master: exclusividade visual por sessão, na abertura ou atualização do app. Proposta sem rotação automática ou disputa simultânea entre cotas.</p>
              <dl className="space-y-3">{content.anchor.tiers.map((tier) => <div key={tier.title} className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-t border-border pt-3"><dt className="text-sm font-medium">{tier.slots} {tier.title}</dt><dd className="text-sm font-semibold text-primary">{money(tier.min)} a {money(tier.max)}<span className="font-normal text-muted-foreground"> /mês{tier.slots > 1 ? " cada" : ""}</span></dd></div>)}</dl>
              <p className="text-xs leading-relaxed text-muted-foreground">Potencial das três cotas: {money(content.anchor.monthlyMin)} a {money(content.anchor.monthlyMax)}/mês, se contratadas. Não incluído na tabela abaixo.</p>
            </div>
            {event && <div className="space-y-4"><h4 className="font-semibold">Patrocínio de Eventos</h4><p className="text-sm leading-relaxed text-muted-foreground">Destaque estratégico de grandes eventos e produtores dentro da agenda, respeitando região, categoria e data do público.</p><p className="border-t border-border pt-3 text-lg font-semibold text-primary">{money(event.min)} a {money(event.max)} <span className="text-sm font-normal text-muted-foreground">· {event.cycle}</span></p><p className="text-sm leading-relaxed text-muted-foreground">{event.description}</p></div>}
          </div>
          {content.advertisingExclusivity && <p className="border-l-2 border-primary pl-4 text-xs leading-relaxed text-muted-foreground">{content.advertisingExclusivity.disclaimer}</p>}
        </section>
        <section className="min-w-0 space-y-4 border-t border-border pt-6">
          <h3 id="pitch-projection" tabIndex={-1} className="scroll-mt-24 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-2 text-xl font-semibold"><TrendingUp className="h-5 w-5 shrink-0 text-primary" /> Projeção de receita mensal</h3>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{content.projectionBasis}</p>
          {content.projectionRegional && <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground"><strong className="font-medium text-foreground">Por praça:</strong> {content.projectionRegional}</p>}
          {content.projectionGlobal && <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground"><strong className="font-medium text-foreground">Escala no Rio de Janeiro:</strong> {content.projectionGlobal}</p>}
          <div className="w-full overflow-x-auto rounded-lg border border-border" tabIndex={0} aria-label="Projeção mensal por período"><table className="w-full min-w-[620px] text-left text-sm"><caption className="sr-only">Cenário ilustrativo de vendas e receita dos meses 1, 6 e 12</caption><thead className="bg-muted/50"><tr><th scope="col" className="p-4 font-medium">Vendas e receita</th>{content.scenarios.map((s) => <th scope="col" key={s.month} className="p-4 font-medium"><span className="block">{s.phase}</span><span className="text-xs text-muted-foreground">Mês {s.month}</span></th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.label} className={row.emphasis ? "border-t border-border bg-muted/30 text-primary" : "border-t border-border"}><th scope="row" className="p-4 font-medium">{row.label}</th>{content.scenarios.map((s) => <td key={s.month} className="whitespace-nowrap p-4 tabular-nums">{row.value(s)}</td>)}</tr>)}</tbody></table></div>
          <p className="text-xs leading-relaxed text-muted-foreground">* {content.disclaimer}</p>
        </section>
        <details className="group border-t border-border pt-5"><summary className="cursor-pointer text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Inventário e condições dos formatos</summary><div className="mt-5 space-y-6">
          {content.inventoryImage && <figure className="space-y-3"><h3 id="pitch-inventory-map" tabIndex={-1} className={headingClass}>Mapa de Inventário Publicitário</h3><img src={content.inventoryImage} alt="Layout conceitual do Coé a Boa?: Master no topo, dois co-patrocinadores abaixo, carrossel regional, banners nativos na Agenda, eventos patrocinados e notificações regionais." width={1536} height={1024} loading="lazy" decoding="async" className="h-auto w-full rounded-lg border border-border" /><figcaption className="text-xs leading-relaxed text-muted-foreground">Ilustração conceitual com marcas fictícias. Os formatos representados não confirmam sua ativação; Master e Sub-Master seguem a proposta de exclusividade por sessão, sem rotação automática.</figcaption></figure>}
          <section className="space-y-3"><h3 id="pitch-regional-ads" tabIndex={-1} className="scroll-mt-24 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-2 text-lg font-semibold"><MapPin className="h-4 w-4 text-primary" /> Publicidade regional</h3><p className="text-sm leading-relaxed text-muted-foreground">{content.differential}</p>{regional && <p className="text-sm leading-relaxed text-muted-foreground">{regional.title}: {money(regional.min)} a {money(regional.max)} · {regional.cycle}.</p>}<p className="text-sm leading-relaxed text-muted-foreground">{content.capacity}</p><p className="text-sm leading-relaxed text-muted-foreground">{content.monetization}</p></section>
          <section className="space-y-3 border-t border-border pt-5"><h3 id="pitch-push" tabIndex={-1} className="scroll-mt-24 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-2 text-lg font-semibold"><BellRing className="h-4 w-4 text-primary" /> {content.push.title}</h3><p className="text-sm leading-relaxed text-muted-foreground">{content.push.example}</p><p className="text-sm font-medium">{money(content.pushTicket)} por disparo regional · {content.push.packageSends} disparos/mês por {money(content.push.packagePrice)}</p><p className="text-xs leading-relaxed text-muted-foreground">{content.push.requirements}</p></section>
          <section className="space-y-4 border-t border-border pt-5"><h3 id="pitch-anchor" tabIndex={-1} className={headingClass}>{content.anchor.title}</h3><p className="text-sm leading-relaxed text-muted-foreground">{content.anchor.billing}</p><div className="grid gap-5 md:grid-cols-2"><div><h4 className="text-sm font-semibold">Banner âncora prioritário na Home</h4><p className="mt-2 text-sm text-muted-foreground">{content.anchor.banner}</p></div><div><h4 className="text-sm font-semibold">Contagem regressiva para o evento</h4><p className="mt-2 text-sm text-muted-foreground">{content.anchor.countdown}</p></div></div><ol className="grid gap-5 md:grid-cols-3">{content.anchor.phases.map((phase, i) => <li key={phase.title}><h4 className="text-sm font-semibold"><span className="mr-2 text-primary">0{i + 1}</span>{phase.title}</h4><p className="mt-2 text-sm text-muted-foreground">{phase.description}</p></li>)}</ol><p className="text-xs leading-relaxed text-muted-foreground">{content.anchor.disclaimer}</p></section>
        </div></details>
    </PitchWindow>
    <PitchWindow value="b2c" number="02" title="Plano de Marketing (Atração de Usuários - B2C)" eyebrow="B2C · Público" icon={Users}>
{content.b2c && <>{navigation("b2c", "Atalhos do Plano de Marketing", [{ id: "pitch-organic-strategy", label: content.b2c.organic.title }, { id: "pitch-paid-strategy", label: content.b2c.paid.title }])}<div className="grid gap-8 md:grid-cols-2">{[content.b2c.organic, content.b2c.paid].map((strategy, i) => <section key={strategy.title} className="space-y-5"><h3 id={i === 1 ? "pitch-paid-strategy" : "pitch-organic-strategy"} tabIndex={-1} className="scroll-mt-24 text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{strategy.title}</h3><ul className="space-y-4">{strategy.items.map((item) => <li key={item.title} className="space-y-1.5 border-t border-border pt-4"><h4 className="text-sm font-semibold">{item.title}</h4><p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p></li>)}</ul>{i === 1 && <p className="border-l-2 border-primary pl-4 text-sm">Verba inicial estimada: <strong className="text-primary">{money(content.marketingMin)} a {money(content.marketingMax)}/mês</strong></p>}</section>)}</div></>}
    </PitchWindow>
    <PitchWindow value="b2b" number="03" title="Plano Comercial (Vendas B2B e Abordagem)" eyebrow="B2B · Anunciantes" icon={BriefcaseBusiness}>
{content.b2b && <><section className="space-y-3"><h3 id="pitch-sales-argument" tabIndex={-1} className={headingClass}>{content.b2b.exclusivity.title}</h3><p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{content.b2b.exclusivity.description}</p></section><section className="space-y-5 border-t border-border pt-6"><h3 id="pitch-prospecting" tabIndex={-1} className={headingClass}>Metodologia de Captação</h3><p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{content.b2b.anchors.description}</p><ol className="grid gap-6 md:grid-cols-3">{content.b2b.anchors.steps.map((step, i) => <li key={step.title} className="space-y-2"><span className="text-xs font-semibold text-primary">0{i + 1}</span><h4 className="text-sm font-semibold">{step.title}</h4><p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p></li>)}</ol></section></>}
        {content.selfService && <details className="group border-t border-border pt-5"><summary className="cursor-pointer text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Evolução futura · Autoatendimento com controle</summary><section className="mt-5 space-y-4"><h3 id="pitch-self-service" tabIndex={-1} className="scroll-mt-24 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-2 text-lg font-semibold"><Workflow className="h-4 w-4 shrink-0 text-primary" /> {content.selfService.title}</h3><p className="text-sm leading-relaxed text-muted-foreground">{content.selfService.description}</p><ol className="grid gap-5 md:grid-cols-2">{content.selfService.steps.map((step) => <li key={step.title} className="space-y-2"><h4 className="text-sm font-semibold">{step.title}</h4><p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p></li>)}</ol><p className="text-sm leading-relaxed text-muted-foreground">{content.selfService.strategy}</p><p className="text-xs leading-relaxed text-muted-foreground">{content.selfService.disclaimer}</p></section></details>}
    </PitchWindow>
    <PitchWindow value="next-steps" number="04" title="Estratégia · Praça-piloto e Lançamento" eyebrow="Estratégia · Lançamento" icon={ArrowRight}>
      {navigation("next-steps", "Atalhos da Estratégia de Lançamento", [
        { id: "pitch-regional-expansion", label: "Plano de Expansão Regional (Fases 2 e 3)" },
        { id: "pitch-hybrid-acquisition", label: "Estratégia de Atração Híbrida" },
      ])}
      <section className="space-y-4">
        <h3 id="pitch-pilot" tabIndex={-1} className={headingClass}>O Ponto de Partida: Ilha do Governador como Praça-Piloto</h3>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">O Coé a Boa? não nasce do zero. Amparado pelo legado e pela base de conhecimento do histórico <em>AgendIlha</em>, o aplicativo inicia sua operação comercial e de comunidade tendo a <strong className="font-medium text-foreground">Ilha do Governador</strong> como sua praça-piloto oficial.</p>
        <ul className="grid gap-5 md:grid-cols-2">{[
          { title: "Vantagem Inicial", description: "Conexão pré-existente com produtores locais, estabelecimentos e o público da região, favorecendo a densidade de conteúdo desde o primeiro dia." },
          { title: "Validação de Produto", description: "Coleta ativa de feedback de usabilidade, refinamento do fluxo de cadastro por flyer e ajuste fino da experiência de quem usa o app em ambiente controlado." },
        ].map((item) => <li key={item.title} className="space-y-2 border-t border-border pt-4"><h4 className="text-sm font-semibold">{item.title}</h4><p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p></li>)}</ul>
      </section>
      <section className="space-y-4 border-t border-border pt-6">
        <h3 id="pitch-governance" tabIndex={-1} className={headingClass}>Ecossistema de Governança e Expansão Regional</h3>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">O controle inteligente de duplicidade e a gestão de cotas — gratuito versus patrocinado — mantêm a curadoria limpa e sustentável. Ao evitar envios repetidos e equilibrar a divulgação orgânica com múltiplas atrações patrocinadas em horários distintos, o Coé a Boa? cria uma base de governança para escalar com segurança para novas praças e regiões metropolitanas além da Ilha do Governador, preservando a revisão pela curadoria.</p>
        <ul className="grid gap-5 md:grid-cols-2">{[
          { title: "Facilidade para quem divulga", description: "Cadastro rápido por flyer, revisão simples e um loop de compartilhamento viral: o produtor divulga o link do evento no WhatsApp e nas redes sociais, traz público e amplia a descoberta de outros rolês no app." },
          { title: "Facilidade para quem busca lazer", description: "Uma agenda organizada para encontrar programas na sua localidade ou em regiões vizinhas, aproximando o público de atrações, produtores e negócios locais sem repetição desnecessária de eventos." },
        ].map((item) => <li key={item.title} className="space-y-2 border-t border-border pt-4"><h4 className="text-sm font-semibold">{item.title}</h4><p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p></li>)}</ul>
      </section>
      <section className="space-y-4 border-t border-border pt-6">
        <h3 id="pitch-regional-expansion" tabIndex={-1} className="scroll-mt-24 text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Plano de Expansão Regional (Fases 2 e 3)</h3>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">Validado o modelo de tração e receita na praça-piloto, o Coé a Boa? poderá expandir de forma direcionada para macro-regiões estratégicas do estado:</p>
        <ul className="grid gap-5 md:grid-cols-2">{[
          { title: "Fase de Adjacência", description: "Expansão para polos vizinhos de alto consumo de lazer, como Niterói." },
          { title: "Fase de Escala Metropolitana", description: "Entrada em mercados de alta densidade populacional na Baixada Fluminense, como Duque de Caxias, e nos principais eixos da capital." },
        ].map((item) => <li key={item.title} className="space-y-2 border-t border-border pt-4"><h4 className="text-sm font-semibold">{item.title}</h4><p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p></li>)}</ul>
      </section>
      <section className="space-y-4 border-t border-border pt-6">
        <h3 id="pitch-hybrid-acquisition" tabIndex={-1} className="scroll-mt-24 text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Estratégia de Atração Híbrida (Go-To-Market)</h3>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">A estratégia de lançamento combina o esforço de guerrilha e o marketing digital de precisão:</p>
        <ul className="grid gap-6 md:grid-cols-3">{[
          { title: "Boca a Boca e Parcerias Locais (B2B Orgânico)", description: "Abordagem direta aos principais bares, quiosques e organizadores de eventos locais, demonstrando a facilidade do cadastro por flyer, com leitura automática e revisão dos dados." },
          { title: "Conteúdo e Comunidade (B2C Orgânico)", description: "Curadoria ativa dos melhores rolês da semana nos canais sociais, incentivando o público a criar o hábito de consultar o app." },
          { title: "Tráfego Pago Hiperlocal", description: "Campanhas segmentadas por geolocalização e raio de interesse para reduzir o desperdício de verba publicitária." },
        ].map((item) => <li key={item.title} className="space-y-2 border-t border-border pt-4"><h4 className="text-sm font-semibold">{item.title}</h4><p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p></li>)}</ul>
      </section>
      <p className="flex items-start gap-2 text-xs text-muted-foreground"><Target aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" /> Plano proposto de lançamento e expansão. Metas, adesão e resultados dependem da validação da praça-piloto; nenhuma campanha é ativada por esta apresentação.</p>
    </PitchWindow>
    <PitchWindow value="singularity" number="05" title="Por que Investir no Coé a Boa? (Singularidade)" eyebrow="Encerramento · Resumo executivo" icon={Sparkles}>
      <section className="space-y-3"><h3 id="pitch-investment-differential" tabIndex={-1} className={headingClass}>Diferencial do Produto</h3>
      <p className="max-w-3xl text-lg font-medium leading-relaxed">Tecnologia sem atrito, publicidade com foco e descoberta cultural hiperlocal em um único produto.</p></section>
      <section className="space-y-3"><h3 id="pitch-investment-ecosystem" tabIndex={-1} className={headingClass}>Ecossistema Hiperlocal</h3>
      <p className="max-w-3xl leading-relaxed text-muted-foreground">O Coé a Boa? combina acesso leve pelo navegador, conteúdo salvo disponível offline e uma proposta de monetização por exclusividade visual, sem carrosséis automáticos nos espaços Master e Sub-Master. Um ecossistema que pode crescer praça a praça no Rio de Janeiro, aproximando público, produtores e negócios locais.</p></section>
      <section className="space-y-3"><h3 id="pitch-investment-opportunity" tabIndex={-1} className={headingClass}>Oportunidade e Validação</h3>
      <p className="max-w-3xl border-l-2 border-primary pl-4 text-sm leading-relaxed text-muted-foreground">A oportunidade é resolver a dificuldade de descobrir programas locais com uma operação enxuta e potencial de conversão comercial. Custos, adesão e resultados dependem da validação do piloto; não representam retorno garantido.</p></section>
    </PitchWindow>
    </Accordion>
  </div>;
}
