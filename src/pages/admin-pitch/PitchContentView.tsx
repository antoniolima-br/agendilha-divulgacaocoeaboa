import { useEffect, useState } from "react";
import { BellRing, BriefcaseBusiness, Crown, MapPin, Megaphone, TrendingUp, Users, Workflow, ArrowRight, Layers3, Sparkles, ScanLine, ChartNoAxesCombined, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PitchChapter } from "./PitchChapter";
import { PitchDetails } from "./PitchDetails";
import { PitchItemList } from "./PitchItemList";
import { withInvestorCopy } from "./investorPitchCopy";
import { PitchProjectionTable, money } from "./PitchProjectionTable";
import { CorporatePillars } from "./CorporatePillars";
import { AdvertiserPitch } from "./AdvertiserPitch";
import { InvestorPdfButton } from "./InvestorPdfButton";
import { investorPitchSections } from "./investorPitchPdf";
import type { AdvertiserPitchContent, PitchContent } from "./types";

export function PitchContentView({ content: sourceContent, audience = "investor" }: { content: PitchContent | AdvertiserPitchContent; audience?: "investor" | "advertiser" }) {
  if (audience === "advertiser") return <AdvertiserPitch content={sourceContent} />;
  return "scenarios" in sourceContent ? <InvestorPitch content={sourceContent} /> : null;
}

function InvestorPitch({ content: sourceContent }: { content: PitchContent }) {
  const content = withInvestorCopy(sourceContent);
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
  }, [destination]);
  const shortcut = (targetId: string, label: string) => <Button key={targetId} asChild variant="outline" size="sm" className="h-auto min-h-11 max-w-full whitespace-normal text-left"><a href={`#${targetId}`} onClick={(event) => {
    event.preventDefault();
    setDestination(targetId);
  }}><ArrowRight aria-hidden="true" /><span>{label}</span></a></Button>;
  const navigation = (label: string, items: { id: string; label: string }[]) => <nav aria-label={label} className="flex flex-wrap gap-2 border-b border-border pb-5">{items.map((item) => shortcut(item.id, item.label))}</nav>;
  const headingClass = "scroll-mt-24 text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const event = content.formats[0];
  const regional = content.formats[1];
  return <div data-investor-pitch className="min-w-0">
      <div className="min-w-0 space-y-10 pb-10 pt-4 sm:pb-14">
        <section aria-labelledby="pitch-overview" className="space-y-5">
          <p className="text-xs font-medium uppercase text-primary">Coé a Boa? · Visão de negócio</p>
          <h2 id="pitch-overview" className="max-w-3xl text-3xl font-semibold leading-tight">Conectando Pessoas, Comércios e a Energia do Rio de Janeiro.</h2>
          {investorPitchSections[0].paragraphs.map((p) => <p key={p} className="max-w-3xl leading-relaxed text-muted-foreground">{p}</p>)}
          <h3 className="pt-2 text-xl font-semibold">{investorPitchSections[1].title}</h3>
          <ul className="divide-y divide-border">{investorPitchSections[1].items.map(([title, description], i) => { const Icon = [MapPin, Layers3, Users][i]; return <li key={title} className="flex min-w-0 items-start gap-4 py-4"><Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" /><div className="space-y-2"><h3 className="text-lg font-semibold">{title}</h3><p className="text-sm leading-relaxed text-muted-foreground">{description}</p></div></li>; })}</ul>
        </section>
        <CorporatePillars />
      </div>
    <PitchChapter value="product" number="01" title="Negócio, Produto e Receita" eyebrow="Produto · Monetização" icon={BriefcaseBusiness}>

        <section className="space-y-3"><h3 id="pitch-product" tabIndex={-1} className={`${headingClass} text-2xl`}>Coé a Boa?</h3><p className="max-w-3xl leading-relaxed text-muted-foreground">{content.brandPositioning}</p></section>
        {content.technology && <section className="space-y-3 border-t border-border pt-6"><h3 id="pitch-technology" tabIndex={-1} className={headingClass}>{content.technology.title}</h3><p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{content.technology.description}</p></section>}
        <section aria-labelledby="pitch-coezinho" className="space-y-3 border-t border-border pt-6">
          <h3 id="pitch-coezinho" className="flex items-center gap-3 text-lg font-semibold"><ScanLine aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" />Coezinho · Tecnologia e Automação Inteligente</h3>
          <p className="max-w-3xl leading-relaxed text-muted-foreground">IA integrada para leitura automática de flyers e extração inteligente de títulos, datas, horários e locais. Menos digitação no celular e mais agilidade para preparar a publicação, com revisão dos dados e aprovação antes de ir ao ar.</p>
          <p className="text-sm leading-relaxed text-muted-foreground">O flyer original é preservado. Se a leitura não completar algum campo, o preenchimento manual continua disponível.</p>
        </section>
        <section aria-labelledby="pitch-value-proof" className="space-y-5 border-t border-border pt-6">
          <h3 id="pitch-value-proof" className="flex items-center gap-3 text-lg font-semibold"><ChartNoAxesCombined aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" />Inteligência de Dados · Prova de Valor e ROI</h3>
          <p className="max-w-3xl leading-relaxed text-muted-foreground">Não basta divulgar: é preciso acompanhar o interesse que a campanha gera. O BI reúne registros de engajamento e resultados comerciais para orientar investimento, ajustes e renovação.</p>
          <ul className="divide-y divide-border">{[
            { title: "Cliques e Abriu-Flyer", description: "Aberturas registradas por rolê, período e canal de origem mostram quais artes despertam interesse. Aberturas não equivalem a pessoas únicas nem a vendas.", icon: MousePointerClick },
            { title: "Convidados e respostas registradas", description: "Listas de convidados e status de convite/RSVP, quando registrados, complementam leads e conversões informadas. Convite ou confirmação não comprova presença no evento.", icon: Users },
            { title: "Relatórios para decidir", description: "Comparar desempenho, origens e resultados registrados ao longo da campanha. Os painéis atualizam os dados coletados; não substituem a medição de vendas do parceiro.", icon: ChartNoAxesCombined },
          ].map(({ title, description, icon: Icon }) => <li key={title} className="flex min-w-0 items-start gap-4 py-4"><Icon aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-primary" /><div className="min-w-0 space-y-2"><h4 className="font-semibold">{title}</h4><p className="text-sm leading-relaxed text-muted-foreground">{description}</p></div></li>)}</ul>
          <p className="max-w-3xl border-l-2 border-primary pl-4 text-sm leading-relaxed text-muted-foreground">ROI exige receita atribuível e custos completos da campanha. Cliques, aberturas e RSVP são sinais de engajamento, não retorno financeiro exato. Com dados do parceiro, é possível avaliar o retorno; sem eles, o relatório apresenta apenas o que foi medido.</p>
        </section>
        <p className="max-w-3xl border-l-2 border-primary pl-4 text-sm leading-relaxed text-muted-foreground">Publicidade regional como base de receita; patrocínios de eventos como complemento. Cinco setores integrados sustentam a operação.</p>
        <PitchDetails>
        <section className="space-y-5 border-t border-border pt-6">
          <h3 id="pitch-formats" tabIndex={-1} className="scroll-mt-24 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-2 text-xl font-semibold"><Megaphone className="h-5 w-5 shrink-0 text-primary" /> Inventário e Condições dos Formatos</h3>
          <div className="space-y-8">
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
          <PitchProjectionTable scenarios={content.scenarios} />
          <p className="text-xs leading-relaxed text-muted-foreground">* {content.disclaimer}</p>
        </section>
        <div className="space-y-6 border-t border-border pt-5">
          {content.inventoryImage && <figure className="space-y-3"><h3 id="pitch-inventory-map" tabIndex={-1} className={headingClass}>Mapa de Inventário Publicitário</h3><img src={content.inventoryImage} alt="Layout conceitual do Coé a Boa?: Master no topo, dois co-patrocinadores abaixo, carrossel regional, banners nativos na Agenda, eventos patrocinados e notificações regionais." width={1536} height={1024} loading="lazy" decoding="async" className="h-auto w-full rounded-lg border border-border" /><figcaption className="text-xs leading-relaxed text-muted-foreground">Ilustração conceitual com marcas fictícias. Os formatos representados não confirmam sua ativação; Master e Sub-Master seguem a proposta de exclusividade por sessão, sem rotação automática.</figcaption></figure>}
          <section className="space-y-3"><h3 id="pitch-regional-ads" tabIndex={-1} className="scroll-mt-24 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-2 text-lg font-semibold"><MapPin className="h-4 w-4 text-primary" /> Publicidade regional</h3><p className="text-sm leading-relaxed text-muted-foreground">{content.differential}</p>{regional && <p className="text-sm leading-relaxed text-muted-foreground">{regional.title}: {money(regional.min)} a {money(regional.max)} · {regional.cycle}.</p>}<p className="text-sm leading-relaxed text-muted-foreground">{content.capacity}</p><p className="text-sm leading-relaxed text-muted-foreground">{content.monetization}</p></section>
          <section className="space-y-3 border-t border-border pt-5"><h3 id="pitch-push" tabIndex={-1} className="scroll-mt-24 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-2 text-lg font-semibold"><BellRing className="h-4 w-4 text-primary" /> {content.push.title}</h3><p className="text-sm leading-relaxed text-muted-foreground">{content.push.example}</p><p className="text-sm font-medium">{money(content.pushTicket)} por disparo regional · {content.push.packageSends} disparos/mês por {money(content.push.packagePrice)}</p></section>
          <section className="space-y-4 border-t border-border pt-5"><h3 id="pitch-anchor" tabIndex={-1} className={headingClass}>{content.anchor.title}</h3><p className="text-sm leading-relaxed text-muted-foreground">{content.anchor.billing}</p><div className="space-y-5"><div><h4 className="text-sm font-semibold">Banner âncora prioritário na Home</h4><p className="mt-2 text-sm text-muted-foreground">{content.anchor.banner}</p></div><div><h4 className="text-sm font-semibold">Contagem regressiva para o evento</h4><p className="mt-2 text-sm text-muted-foreground">{content.anchor.countdown}</p></div></div><ol className="space-y-5">{content.anchor.phases.map((phase, i) => <li key={phase.title}><h4 className="text-sm font-semibold"><span className="mr-2 text-primary">0{i + 1}</span>{phase.title}</h4><p className="mt-2 text-sm text-muted-foreground">{phase.description}</p></li>)}</ol></section>
        </div>
        </PitchDetails>
    </PitchChapter>
    <PitchChapter value="b2c" number="02" title="Plano de Marketing · B2C & Aceleração" eyebrow="B2C · Público" icon={Users}>
      <section className="max-w-3xl space-y-3"><h3 className={headingClass}>Comunidade primeiro, mídia local para acelerar</h3><p className="leading-relaxed text-muted-foreground">Acesso por link, boca a boca e curadoria semanal criam o hábito de consultar a agenda. Tráfego pago hiperlocal amplia a descoberta, com investimento ajustado aos resultados.</p></section>
{content.b2c && <>{navigation("Atalhos do Plano de Marketing", [{ id: "pitch-paid-strategy", label: "Estratégia Paga · Aceleração e Escala" }])}<PitchDetails><div className="space-y-8">{[content.b2c.organic, content.b2c.paid].map((strategy, i) => <section key={strategy.title} className="space-y-5"><h3 id={i === 1 ? "pitch-paid-strategy" : "pitch-organic-strategy"} tabIndex={-1} className="scroll-mt-24 text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{strategy.title}</h3><ul className="space-y-4">{strategy.items.map((item) => <li key={item.title} className="space-y-1.5 border-t border-border pt-4"><h4 className="text-sm font-semibold">{item.title}</h4><p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p></li>)}</ul>{i === 1 && <p className="border-l-2 border-primary pl-4 text-sm">Verba inicial estimada: <strong className="text-primary">{money(content.marketingMin)} a {money(content.marketingMax)}/mês</strong></p>}</section>)}</div></PitchDetails></>}
    </PitchChapter>
    <PitchChapter value="b2b" number="03" title="Plano Comercial · Abordagem B2B" eyebrow="B2B · Anunciantes" icon={BriefcaseBusiness}>
      <section className="max-w-3xl space-y-3"><h3 className={headingClass}>Visibilidade de bairro, resultados acompanhados</h3><p className="leading-relaxed text-muted-foreground">O Comercial conduz prospecção, pacotes personalizados e pós-venda ativo. Cada proposta define região, espaços, período, investimento e indicadores que serão acompanhados com o parceiro.</p><p className="text-sm leading-relaxed text-muted-foreground">Marketing cuida das artes e campanhas. Financeiro concilia pagamentos e mantém o histórico rastreável; a liberação de publicação paga depende de pagamento comprovado. Cortesias e permutas ficam separadas da receita recebida.</p></section>
      <PitchDetails>
{content.b2b && <><section className="space-y-3"><h3 id="pitch-sales-argument" tabIndex={-1} className={headingClass}>{content.b2b.exclusivity.title}</h3><p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{content.b2b.exclusivity.description}</p></section><section className="space-y-5 border-t border-border pt-6"><h3 id="pitch-prospecting" tabIndex={-1} className={headingClass}>Metodologia de Captação</h3><p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{content.b2b.anchors.description}</p><ol className="space-y-6">{content.b2b.anchors.steps.map((step, i) => <li key={step.title} className="space-y-2"><span className="text-xs font-semibold text-primary">0{i + 1}</span><h4 className="text-sm font-semibold">{step.title}</h4><p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p></li>)}</ol></section></>}
        {content.selfService && <section className="space-y-4 border-t border-border pt-5"><h3 id="pitch-self-service" tabIndex={-1} className="scroll-mt-24 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-2 text-lg font-semibold"><Workflow className="h-4 w-4 shrink-0 text-primary" /> {content.selfService.title}</h3><p className="text-sm leading-relaxed text-muted-foreground">{content.selfService.description}</p><ol className="space-y-5">{content.selfService.steps.map((step) => <li key={step.title} className="space-y-2"><h4 className="text-sm font-semibold">{step.title}</h4><p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p></li>)}</ol><p className="text-sm leading-relaxed text-muted-foreground">{content.selfService.strategy}</p></section>}
      </PitchDetails>
    </PitchChapter>
    <PitchChapter value="next-steps" number="04" title="Estratégia de Lançamento e Expansão Regional" eyebrow="Estratégia · Lançamento" icon={ArrowRight}>
      <section className="space-y-4">
        <h3 id="pitch-pilot" tabIndex={-1} className={headingClass}>O Ponto de Partida: Ilha do Governador como Praça-Piloto</h3>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">A <strong className="font-medium text-foreground">Ilha do Governador</strong> é a praça-piloto oficial. O legado do <em>AgendIlha</em> conecta o projeto a produtores, estabelecimentos e público local.</p>
      </section>
      <p className="max-w-3xl border-l-2 border-primary pl-4 text-sm leading-relaxed text-muted-foreground">Validar produto, tração e receita no piloto antes de avançar para Niterói e a Baixada Fluminense.</p>
      <PitchDetails>
      <section className="space-y-4">
        <PitchItemList items={[
          { title: "Vantagem Inicial", description: "Relações locais e conhecimento da região como ponto de partida." },
          { title: "Validação de Produto", description: "Ouvir o público e refinar o cadastro por flyer e a experiência de uso." },
        ]} />
      </section>
      <section className="space-y-4 border-t border-border pt-6">
        <h3 id="pitch-governance" tabIndex={-1} className={headingClass}>Ecossistema de Governança e Expansão Regional</h3>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">O controle inteligente de duplicidade e as cotas — gratuito versus patrocinado — apoiam uma curadoria limpa. Revisão e horários distintos sustentam a expansão além da Ilha do Governador.</p>
        <PitchItemList items={[
          { title: "Facilidade para quem divulga", description: "Cadastro por flyer, revisão rápida e loop de compartilhamento viral no WhatsApp e nas redes." },
          { title: "Facilidade para quem busca lazer", description: "Uma agenda organizada para descobrir rolês locais e em regiões vizinhas." },
        ]} />
      </section>
      <section className="space-y-4 border-t border-border pt-6">
        <h3 id="pitch-regional-expansion" tabIndex={-1} className="scroll-mt-24 text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Plano de Expansão Regional (Fases 2 e 3)</h3>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">Após validar tração e receita no piloto, expandir por etapas:</p>
        <PitchItemList items={[
          { title: "Fase de Adjacência", description: "Avançar para polos vizinhos, como Niterói." },
          { title: "Fase de Escala Metropolitana", description: "Chegar à Baixada Fluminense, como Duque de Caxias, e aos principais eixos da capital." },
        ]} />
      </section>
      <section className="space-y-4 border-t border-border pt-6">
        <h3 id="pitch-hybrid-acquisition" tabIndex={-1} className="scroll-mt-24 text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Estratégia de Atração Híbrida (Go-To-Market)</h3>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">Parcerias, curadoria e mídia local para conquistar público:</p>
        <PitchItemList className="space-y-6" items={[
          { title: "Boca a Boca e Parcerias Locais (B2B Orgânico)", description: "Visitar bares, quiosques e organizadores; demonstrar o cadastro por flyer." },
          { title: "Conteúdo e Comunidade (B2C Orgânico)", description: "Compartilhar os melhores rolês da semana e fortalecer o hábito de consultar a agenda." },
          { title: "Tráfego Pago Hiperlocal", description: "Segmentar por geolocalização e raio de interesse; medir antes de ampliar." },
        ]} />
      </section>
      </PitchDetails>
    </PitchChapter>
    <PitchChapter value="singularity" number="05" title="Conclusão · Propósito e Futuro" eyebrow="Encerramento · Construir juntos" icon={Sparkles}>
      <section className="space-y-3"><h3 id="pitch-investment-differential" tabIndex={-1} className={headingClass}>{investorPitchSections[2].title}</h3>
      {investorPitchSections[2].paragraphs.map((p) => <p key={p} className="max-w-3xl leading-relaxed text-muted-foreground">{p}</p>)}</section>
      <section aria-labelledby="pitch-partnership" className="space-y-4 border-t border-border pt-6"><h3 id="pitch-partnership" className="text-xl font-semibold">{investorPitchSections[3].title}</h3><p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{investorPitchSections[3].paragraphs[0]}</p></section>
      <PitchDetails>
      <section className="space-y-3"><h3 id="pitch-investment-ecosystem" tabIndex={-1} className={headingClass}>Ecossistema Hiperlocal</h3>
      <p className="max-w-3xl leading-relaxed text-muted-foreground">Curadoria, cadastro rápido e publicidade de bairro conectam público, produtores e comerciantes. Preparado para escalar praça a praça, com governança e validação do piloto.</p></section>
      <section className="space-y-3"><h3 id="pitch-investment-opportunity" tabIndex={-1} className={headingClass}>Oportunidade e Validação</h3>
      <p className="max-w-3xl border-l-2 border-primary pl-4 text-sm leading-relaxed text-muted-foreground">Crescer no mercado de lazer local com operação enxuta, governança e resultados medidos.</p></section>
      </PitchDetails>
    </PitchChapter>

    <footer aria-label="Notas institucionais" className="mt-10 space-y-4 border-t border-border pt-6 text-xs leading-relaxed text-muted-foreground">
      <p>Preços sugeridos e projeções ilustrativas; não representam receita realizada nem retorno garantido. Expansão sujeita à validação da praça-piloto.</p>
      <p>Formatos, exclusividade, contagem regressiva e autoatendimento são propostas comerciais; esta apresentação não ativa campanhas, cobranças ou disparos. Push exige consentimento, segmentação e implantação.</p>
    </footer>
    <div className="mt-8 flex justify-center border-t border-border pt-8"><InvestorPdfButton /></div>
  </div>;
}
