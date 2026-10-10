import { BellRing, BriefcaseBusiness, Crown, MapPin, Megaphone, TrendingUp, Users, Workflow, ArrowRight, Target } from "lucide-react";
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
  const event = content.formats[0];
  const regional = content.formats[1];
  return <div className="space-y-6">
    <Accordion type="multiple" defaultValue={["product"]} className="space-y-4">
    <PitchWindow value="product" number="01" title="O Produto e Fontes de Receita (Monetização)" eyebrow="Produto · Monetização" icon={BriefcaseBusiness}>

        <section className="space-y-3"><h3 className="text-2xl font-semibold">Coé a Boa?</h3><p className="max-w-3xl leading-relaxed text-muted-foreground">{content.brandPositioning}</p></section>
        {content.technology && <section className="space-y-3 border-t border-border pt-6"><h3 className="text-lg font-semibold">{content.technology.title}</h3><p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{content.technology.description}</p></section>}
        <section className="space-y-5 border-t border-border pt-6">
          <h3 className="flex items-center gap-2 text-xl font-semibold"><Megaphone className="h-5 w-5 shrink-0 text-primary" /> Inventário e Condições dos Formatos</h3>
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
          <h3 className="flex items-center gap-2 text-xl font-semibold"><TrendingUp className="h-5 w-5 shrink-0 text-primary" /> Projeção de receita mensal</h3>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{content.projectionBasis}</p>
          {content.projectionRegional && <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground"><strong className="font-medium text-foreground">Por praça:</strong> {content.projectionRegional}</p>}
          {content.projectionGlobal && <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground"><strong className="font-medium text-foreground">Escala no Rio de Janeiro:</strong> {content.projectionGlobal}</p>}
          <div className="w-full overflow-x-auto rounded-lg border border-border" tabIndex={0} aria-label="Projeção mensal por período"><table className="w-full min-w-[620px] text-left text-sm"><caption className="sr-only">Cenário ilustrativo de vendas e receita dos meses 1, 6 e 12</caption><thead className="bg-muted/50"><tr><th scope="col" className="p-4 font-medium">Vendas e receita</th>{content.scenarios.map((s) => <th scope="col" key={s.month} className="p-4 font-medium"><span className="block">{s.phase}</span><span className="text-xs text-muted-foreground">Mês {s.month}</span></th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.label} className={row.emphasis ? "border-t border-border bg-muted/30 text-primary" : "border-t border-border"}><th scope="row" className="p-4 font-medium">{row.label}</th>{content.scenarios.map((s) => <td key={s.month} className="whitespace-nowrap p-4 tabular-nums">{row.value(s)}</td>)}</tr>)}</tbody></table></div>
          <p className="text-xs leading-relaxed text-muted-foreground">* {content.disclaimer}</p>
        </section>
        <details className="group border-t border-border pt-5"><summary className="cursor-pointer text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Inventário e condições dos formatos</summary><div className="mt-5 space-y-6">
          {content.inventoryImage && <figure className="space-y-3"><h3 className="text-lg font-semibold">Mapa de Inventário Publicitário</h3><img src={content.inventoryImage} alt="Layout conceitual do Coé a Boa?: Master no topo, dois co-patrocinadores abaixo, carrossel regional, banners nativos na Agenda, eventos patrocinados e notificações regionais." width={1536} height={1024} loading="lazy" decoding="async" className="h-auto w-full rounded-lg border border-border" /><figcaption className="text-xs leading-relaxed text-muted-foreground">Ilustração conceitual com marcas fictícias. Os formatos representados não confirmam sua ativação; Master e Sub-Master seguem a proposta de exclusividade por sessão, sem rotação automática.</figcaption></figure>}
          <section className="space-y-3"><h3 className="flex items-center gap-2 text-lg font-semibold"><MapPin className="h-4 w-4 text-primary" /> Publicidade regional</h3><p className="text-sm leading-relaxed text-muted-foreground">{content.differential}</p>{regional && <p className="text-sm leading-relaxed text-muted-foreground">{regional.title}: {money(regional.min)} a {money(regional.max)} · {regional.cycle}.</p>}<p className="text-sm leading-relaxed text-muted-foreground">{content.capacity}</p><p className="text-sm leading-relaxed text-muted-foreground">{content.monetization}</p></section>
          <section className="space-y-3 border-t border-border pt-5"><h3 className="flex items-center gap-2 text-lg font-semibold"><BellRing className="h-4 w-4 text-primary" /> {content.push.title}</h3><p className="text-sm leading-relaxed text-muted-foreground">{content.push.example}</p><p className="text-sm font-medium">{money(content.pushTicket)} por disparo regional · {content.push.packageSends} disparos/mês por {money(content.push.packagePrice)}</p><p className="text-xs leading-relaxed text-muted-foreground">{content.push.requirements}</p></section>
          <section className="space-y-4 border-t border-border pt-5"><h3 className="text-lg font-semibold">{content.anchor.title}</h3><p className="text-sm leading-relaxed text-muted-foreground">{content.anchor.billing}</p><div className="grid gap-5 md:grid-cols-2"><div><h4 className="text-sm font-semibold">Banner âncora prioritário na Home</h4><p className="mt-2 text-sm text-muted-foreground">{content.anchor.banner}</p></div><div><h4 className="text-sm font-semibold">Contagem regressiva para o evento</h4><p className="mt-2 text-sm text-muted-foreground">{content.anchor.countdown}</p></div></div><ol className="grid gap-5 md:grid-cols-3">{content.anchor.phases.map((phase, i) => <li key={phase.title}><h4 className="text-sm font-semibold"><span className="mr-2 text-primary">0{i + 1}</span>{phase.title}</h4><p className="mt-2 text-sm text-muted-foreground">{phase.description}</p></li>)}</ol><p className="text-xs leading-relaxed text-muted-foreground">{content.anchor.disclaimer}</p></section>
        </div></details>
    </PitchWindow>
    <PitchWindow value="b2c" number="02" title="Plano de Marketing (Atração de Usuários - B2C)" eyebrow="B2C · Público" icon={Users}>
{content.b2c && <div className="grid gap-8 md:grid-cols-2">{[content.b2c.organic, content.b2c.paid].map((strategy, i) => <section key={strategy.title} className="space-y-5"><h3 className="text-lg font-semibold">{strategy.title}</h3><ul className="space-y-4">{strategy.items.map((item) => <li key={item.title} className="space-y-1.5 border-t border-border pt-4"><h4 className="text-sm font-semibold">{item.title}</h4><p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p></li>)}</ul>{i === 1 && <p className="border-l-2 border-primary pl-4 text-sm">Verba inicial estimada: <strong className="text-primary">{money(content.marketingMin)} a {money(content.marketingMax)}/mês</strong></p>}</section>)}</div>}
    </PitchWindow>
    <PitchWindow value="b2b" number="03" title="Plano Comercial (Vendas B2B e Abordagem)" eyebrow="B2B · Anunciantes" icon={BriefcaseBusiness}>
{content.b2b && <><section className="space-y-3"><h3 className="text-lg font-semibold">{content.b2b.exclusivity.title}</h3><p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{content.b2b.exclusivity.description}</p></section><section className="space-y-5 border-t border-border pt-6"><h3 className="text-lg font-semibold">Metodologia de Captação</h3><p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{content.b2b.anchors.description}</p><ol className="grid gap-6 md:grid-cols-3">{content.b2b.anchors.steps.map((step, i) => <li key={step.title} className="space-y-2"><span className="text-xs font-semibold text-primary">0{i + 1}</span><h4 className="text-sm font-semibold">{step.title}</h4><p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p></li>)}</ol></section></>}
        {content.selfService && <details className="group border-t border-border pt-5"><summary className="cursor-pointer text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Evolução futura · Autoatendimento com controle</summary><section className="mt-5 space-y-4"><h3 className="flex items-center gap-2 text-lg font-semibold"><Workflow className="h-4 w-4 shrink-0 text-primary" /> {content.selfService.title}</h3><p className="text-sm leading-relaxed text-muted-foreground">{content.selfService.description}</p><ol className="grid gap-5 md:grid-cols-2">{content.selfService.steps.map((step) => <li key={step.title} className="space-y-2"><h4 className="text-sm font-semibold">{step.title}</h4><p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p></li>)}</ol><p className="text-sm leading-relaxed text-muted-foreground">{content.selfService.strategy}</p><p className="text-xs leading-relaxed text-muted-foreground">{content.selfService.disclaimer}</p></section></details>}
    </PitchWindow>
    </Accordion>
    <section aria-labelledby="pitch-next-step" className="space-y-5 border-t-2 border-primary py-6 sm:py-8">
      <div className="flex items-center gap-3"><ArrowRight aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" /><h2 id="pitch-next-step" className="text-xl font-semibold sm:text-2xl">Próximo Passo</h2></div>
      <p className="max-w-3xl leading-relaxed text-muted-foreground">Alinhamento final com os sócios, definição de metas da primeira praça-piloto — Ilha do Governador — e início imediato da validação técnica e comercial do PWA.</p>
      <ol className="grid gap-6 md:grid-cols-3">{[
        { title: "Alinhar com os sócios", description: "Confirmar a proposta, as entregas e os responsáveis pela primeira etapa." },
        { title: "Definir metas do piloto", description: "Acordar objetivos de público, parceiros, cotas e orçamento para a primeira praça." },
        { title: "Iniciar a validação", description: "Testar acesso, instalação e limites offline do PWA; validar a proposta com negócios e produtores locais." },
      ].map((step, i) => <li key={step.title} className="space-y-2"><span className="text-xs font-semibold text-primary">0{i + 1}</span><h3 className="font-semibold">{step.title}</h3><p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p></li>)}</ol>
      <p className="flex items-start gap-2 text-xs text-muted-foreground"><Target aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" /> Etapa proposta para decisão dos sócios. Metas e resultados ainda precisam ser validados.</p>
    </section>
  </div>;
}
