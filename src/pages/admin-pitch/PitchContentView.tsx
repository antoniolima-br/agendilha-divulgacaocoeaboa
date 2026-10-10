import { BellRing, BriefcaseBusiness, Crown, MapPin, Megaphone, Target, TrendingUp, Users, Workflow } from "lucide-react";

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
  return <div className="space-y-6">
    <article className="pitch-window" aria-labelledby="pitch-product-title">
      <header className="pitch-window-header"><span className="text-sm font-semibold text-primary">01</span><div className="min-w-0"><p className="text-xs font-medium uppercase text-muted-foreground">Produto & receita</p><h2 id="pitch-product-title" className="text-xl font-semibold sm:text-2xl">O Produto, Formatos e Projeção Financeira</h2></div><BriefcaseBusiness className="ml-auto h-5 w-5 shrink-0 text-primary" /></header>
      <div className="pitch-window-body">
    <section className="space-y-4 border-b border-border pb-8">
      <h2 className="text-2xl font-semibold">Coé a Boa?</h2>
      <p className="max-w-3xl text-lg leading-relaxed">{content.brandPositioning}</p>
    </section>
    {content.technology && <section className="space-y-3 border-b border-border pb-8"><h3 className="text-lg font-semibold">{content.technology.title}</h3><p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{content.technology.description}</p></section>}
    {content.inventoryImage && <section className="space-y-4 border-b border-border pb-8" aria-labelledby="inventory-map-title">
      <h2 id="inventory-map-title" className="flex items-start gap-2 text-xl font-semibold"><Megaphone className="mt-0.5 h-5 w-5 shrink-0 text-primary" /> Mapa de Inventário Publicitário</h2>
      <figure className="space-y-4">
        <img src={content.inventoryImage} alt="Layout conceitual do Coé a Boa?: Master no topo, dois co-patrocinadores abaixo, carrossel regional, banners nativos na Agenda, eventos patrocinados e notificações regionais." width={1536} height={1024} loading="lazy" decoding="async" className="h-auto w-full rounded-lg border border-border" />
        <figcaption className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>Ilustração conceitual com eventos e marcas fictícios. Os espaços representam a proposta comercial, não a confirmação de formatos já ativados.</p>
          <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
            {content.anchor.tiers.map((tier) => <li key={tier.title}><span className="font-medium text-foreground">{tier.slots} {tier.title}:</span> {money(tier.min)} a {money(tier.max)}/mês{tier.slots > 1 ? " cada" : ""}.</li>)}
            {content.formats.slice(0, 2).map((format) => <li key={format.title}><span className="font-medium text-foreground">{format.title}:</span> {money(format.min)} a {money(format.max)} · {format.cycle}.</li>)}
            <li><span className="font-medium text-foreground">Push regional:</span> {money(content.pushTicket)} por disparo; {content.push.packageSends} disparos/mês por {money(content.push.packagePrice)}.</li>
          </ul>
        </figcaption>
      </figure>
    </section>}
    <section className="space-y-4 border-b border-border pb-8">
      <h2 className="flex items-center gap-2 text-xl font-semibold"><MapPin className="h-5 w-5 shrink-0 text-primary" /> O diferencial: hiperlocalidade</h2>
      <p className="max-w-3xl text-lg leading-relaxed">{content.differential}</p>
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{content.regionalExample}</p>
    </section>
    <section className="space-y-4">
      <h2 className="flex items-center gap-2 text-xl font-semibold"><Megaphone className="h-5 w-5 shrink-0 text-primary" /> Formatos e valores sugeridos</h2>
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{content.monetization}</p>
      <div className="grid gap-4 md:grid-cols-2">{content.formats.map((format) => <div key={format.title} className="space-y-3 border-t border-border pt-4">
        <div><p className="text-sm text-muted-foreground">{format.cycle}</p><h3 className="text-lg font-semibold leading-snug">{format.title}</h3></div>
        <div className="space-y-3"><p className="text-2xl font-semibold text-primary">{money(format.min)}{format.min !== format.max && <> <span className="text-base font-normal text-muted-foreground">a</span> {money(format.max)}</>}{format.priceSuffix && <span className="text-sm font-normal text-muted-foreground"> {format.priceSuffix}</span>}</p><p className="text-sm leading-relaxed text-muted-foreground">{format.description}</p></div>
      </div>)}</div>
      <p className="border-l-2 border-primary pl-4 text-sm leading-relaxed text-muted-foreground">{content.capacity}</p>
    </section>
    <section className="space-y-4 border-t border-border pt-8">
      <h2 className="flex items-center gap-2 text-xl font-semibold"><BellRing className="h-5 w-5 shrink-0 text-primary" /> {content.push.title}</h2>
      <p className="max-w-3xl text-lg leading-relaxed">{content.push.example}</p>
      <p className="max-w-3xl text-sm leading-relaxed">{content.push.value}</p>
      <p className="text-lg font-medium">{money(content.pushTicket)} por disparo regional <span className="text-muted-foreground">·</span> {content.push.packageSends} disparos/mês por {money(content.push.packagePrice)}</p>
      <p className="max-w-3xl border-l-2 border-primary pl-4 text-sm leading-relaxed text-muted-foreground">{content.push.requirements}</p>
    </section>
    <section className="space-y-5 border-t border-border pt-8">
      <h2 className="flex items-start gap-2 text-xl font-semibold"><Crown className="mt-0.5 h-5 w-5 shrink-0 text-primary" /> {content.anchor.title}</h2>
      <p className="max-w-3xl text-lg leading-relaxed">{content.anchor.description}</p>
      <p className="max-w-3xl text-sm leading-relaxed">{content.anchor.billing}</p>
      <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">{content.anchor.tiers.map((tier) => <div key={tier.title} className="space-y-2 border-t border-border pt-4"><h3 className="font-semibold">{tier.slots} {tier.title}</h3><p className="text-lg font-medium text-primary">{money(tier.min)} a {money(tier.max)}<span className="text-sm font-normal text-muted-foreground"> /mês{tier.slots > 1 ? " cada" : ""}</span></p><p className="text-sm leading-relaxed text-muted-foreground">{tier.description}</p></div>)}</div>
      <p className="text-sm font-medium">Potencial com os 3 espaços contratados: <span className="text-primary">{money(content.anchor.monthlyMin)} a {money(content.anchor.monthlyMax)}/mês</span></p>
      <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
        <div className="space-y-2"><h3 className="font-semibold">Banner âncora prioritário na Home</h3><p className="text-sm leading-relaxed text-muted-foreground">{content.anchor.banner}</p></div>
        <div className="space-y-2"><h3 className="font-semibold">Contagem regressiva para o evento</h3><p className="text-sm leading-relaxed text-muted-foreground">{content.anchor.countdown}</p></div>
      </div>
      <div className="grid gap-x-8 gap-y-5 md:grid-cols-3">{content.anchor.phases.map((phase, i) => <div key={phase.title} className="space-y-2 border-t border-border pt-4"><h3 className="font-semibold"><span className="mr-2 text-primary">0{i + 1}</span>{phase.title}</h3><p className="text-sm leading-relaxed text-muted-foreground">{phase.description}</p></div>)}</div>
      <p className="max-w-3xl border-l-2 border-primary pl-4 text-sm leading-relaxed text-muted-foreground">{content.anchor.disclaimer}</p>
    </section>
    <section className="min-w-0 space-y-4">
      <h2 className="flex items-center gap-2 text-xl font-semibold"><TrendingUp className="h-5 w-5 shrink-0 text-primary" /> Projeção de receita mensal</h2>
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{content.projectionBasis}</p>
      {content.projectionRegional && <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground"><strong className="font-medium text-foreground">Por Região Atendida:</strong> {content.projectionRegional}</p>}
      {content.projectionGlobal && <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground"><strong className="font-medium text-foreground">Potencial Global (Rio de Janeiro):</strong> {content.projectionGlobal}</p>}
      <div className="w-full overflow-x-auto rounded-lg border border-border" tabIndex={0} aria-label="Projeção mensal por período">
        <table className="w-full min-w-[620px] text-left text-sm">
          <caption className="sr-only">Cenário ilustrativo de vendas e receita dos meses 1, 6 e 12</caption>
          <thead className="bg-muted/50"><tr><th scope="col" className="p-4 font-medium">Vendas e receita</th>{content.scenarios.map((s) => <th scope="col" key={s.month} className="p-4 font-medium"><span className="block">{s.phase}</span><span className="text-xs text-muted-foreground">Mês {s.month}</span></th>)}</tr></thead>
          <tbody>{rows.map((row) => <tr key={row.label} className={row.emphasis ? "border-t border-border bg-muted/30 text-primary" : "border-t border-border"}><th scope="row" className="p-4 font-medium">{row.label}</th>{content.scenarios.map((s) => <td key={s.month} className="whitespace-nowrap p-4 tabular-nums">{row.value(s)}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">* {content.disclaimer}</p>
    </section>
    {content.advertisingExclusivity && <section className="space-y-5 border-t border-border pt-8">
      <h2 className="flex items-start gap-2 text-xl font-semibold"><Megaphone className="mt-0.5 h-5 w-5 shrink-0 text-primary" /> {content.advertisingExclusivity.title}</h2>
      <p className="max-w-3xl text-lg leading-relaxed">{content.advertisingExclusivity.description}</p>
      <ul className="max-w-3xl space-y-4">{content.advertisingExclusivity.items.map((item) => <li key={item.title} className="text-sm leading-relaxed text-muted-foreground"><strong className="font-medium text-foreground">{item.title}:</strong> {item.description}</li>)}</ul>
      <p className="max-w-3xl border-l-2 border-primary pl-4 text-sm leading-relaxed text-muted-foreground">{content.advertisingExclusivity.disclaimer}</p>
    </section>}
      </div>
    </article>
    <article className="pitch-window" aria-labelledby="pitch-b2c-title">
      <header className="pitch-window-header"><span className="text-sm font-semibold text-success">02</span><div className="min-w-0"><p className="text-xs font-medium uppercase text-muted-foreground">B2C · Público</p><h2 id="pitch-b2c-title" className="text-xl font-semibold sm:text-2xl">{content.b2c?.title ?? "Plano de Marketing — Atração e Engajamento de Usuários"}</h2></div><Users className="ml-auto h-5 w-5 shrink-0 text-success" /></header>
      <div className="pitch-window-body">
        {content.b2c && <div className="grid gap-8 md:grid-cols-2">{[content.b2c.organic, content.b2c.paid].map((strategy) => <section key={strategy.title} className="space-y-5"><h3 className="text-lg font-semibold">{strategy.title}</h3><ul className="space-y-5">{strategy.items.map((item) => <li key={item.title} className="space-y-1.5 border-t border-border pt-4"><h4 className="text-sm font-semibold">{item.title}</h4><p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p></li>)}</ul></section>)}</div>}
    <section className="space-y-5 border-t border-border pt-8">
      <h2 className="flex items-center gap-2 text-xl font-semibold"><Target className="h-5 w-5 shrink-0 text-primary" /> Aquisição: tráfego pago hiperlocal</h2>
      <p className="text-lg font-medium">Orçamento inicial: <span className="text-primary">{money(content.marketingMin)} a {money(content.marketingMax)}/mês</span></p>
      <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">{content.acquisition.map((item, i) => <div key={item.title} className="space-y-2"><h3 className="font-semibold"><span className="mr-2 text-primary">0{i + 1}</span>{item.title}</h3><p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p></div>)}</div>
    </section>
      </div>
    </article>
    <article className="pitch-window" aria-labelledby="pitch-b2b-title">
      <header className="pitch-window-header"><span className="text-sm font-semibold text-primary">03</span><div className="min-w-0"><p className="text-xs font-medium uppercase text-muted-foreground">B2B · Anunciantes</p><h2 id="pitch-b2b-title" className="text-xl font-semibold sm:text-2xl">{content.b2b?.title ?? "Plano Comercial & Marketing de Vendas"}</h2></div><BriefcaseBusiness className="ml-auto h-5 w-5 shrink-0 text-primary" /></header>
      <div className="pitch-window-body">
        {content.b2b && <><section className="space-y-3"><h3 className="text-lg font-semibold">{content.b2b.exclusivity.title}</h3><p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{content.b2b.exclusivity.description}</p></section><section className="space-y-5 border-t border-border pt-8"><h3 className="text-lg font-semibold">{content.b2b.anchors.title}</h3><p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{content.b2b.anchors.description}</p><ol className="grid gap-6 md:grid-cols-3">{content.b2b.anchors.steps.map((step, i) => <li key={step.title} className="space-y-2"><span className="text-xs font-semibold text-primary">0{i + 1}</span><h4 className="text-sm font-semibold">{step.title}</h4><p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p></li>)}</ol></section></>}
    {content.selfService && <section className="space-y-5 border-t border-border pt-8" aria-labelledby="self-service-title">
      <h2 id="self-service-title" className="flex items-start gap-2 text-xl font-semibold"><Workflow className="mt-0.5 h-5 w-5 shrink-0 text-primary" /> {content.selfService.title}</h2>
      <p className="text-xs font-medium uppercase text-muted-foreground">Próximo passo · Escala com controle</p>
      <p className="max-w-3xl text-lg leading-relaxed">{content.selfService.description}</p>
      <ol className="grid gap-x-8 gap-y-5 md:grid-cols-2">{content.selfService.steps.map((step, i) => <li key={step.title} className="space-y-2 border-t border-border pt-4"><h3 className="font-semibold"><span className="mr-2 text-primary">0{i + 1}</span>{step.title}</h3><p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p></li>)}</ol>
      <p className="max-w-3xl border-l-2 border-primary pl-4 text-base leading-relaxed">{content.selfService.strategy}</p>
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{content.selfService.disclaimer}</p>
    </section>}
      </div>
    </article>
  </div>;
}
