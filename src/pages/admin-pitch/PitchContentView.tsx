import { MapPin, Megaphone, Target, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PitchContent } from "./types";

const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
type Scenario = PitchContent["scenarios"][number];
const rows: { label: string; value: (s: Scenario) => string | number; emphasis?: boolean }[] = [
  { label: "Regiões atendidas", value: (s) => s.regions },
  { label: "Espaços de 30 dias", value: (s) => s.placements },
  { label: "Patrocínios de 7 dias / mês", value: (s) => s.events },
  { label: "Receita de espaços", value: (s) => money(s.placementRevenue) },
  { label: "Receita de patrocínios", value: (s) => money(s.eventRevenue) },
  { label: "Receita bruta mensal", value: (s) => money(s.revenue), emphasis: true },
  { label: "Investimento em marketing", value: (s) => money(s.marketing) },
  { label: "Receita após marketing*", value: (s) => money(s.afterMarketing) },
];
export function PitchContentView({ content }: { content: PitchContent }) {
  return <div className="space-y-10">
    <section className="space-y-4 border-b border-border pb-8">
      <h2 className="flex items-center gap-2 text-xl font-semibold"><MapPin className="h-5 w-5 shrink-0 text-primary" /> O diferencial: hiperlocalidade</h2>
      <p className="max-w-3xl text-lg leading-relaxed">{content.differential}</p>
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{content.regionalExample}</p>
    </section>
    <section className="space-y-4">
      <h2 className="flex items-center gap-2 text-xl font-semibold"><Megaphone className="h-5 w-5 shrink-0 text-primary" /> Formatos e valores sugeridos</h2>
      <div className="grid gap-4 md:grid-cols-2">{content.formats.map((format) => <Card key={format.title} className="rounded-lg shadow-none">
        <CardHeader><p className="text-sm text-muted-foreground">{format.cycle}</p><CardTitle className="text-lg leading-snug">{format.title}</CardTitle></CardHeader>
        <CardContent className="space-y-3"><p className="text-2xl font-semibold text-primary">{money(format.min)} <span className="text-base font-normal text-muted-foreground">a</span> {money(format.max)}</p><p className="text-sm leading-relaxed text-muted-foreground">{format.description}</p></CardContent>
      </Card>)}</div>
      <p className="border-l-2 border-primary pl-4 text-sm leading-relaxed text-muted-foreground">{content.capacity}</p>
    </section>
    <section className="min-w-0 space-y-4">
      <h2 className="flex items-center gap-2 text-xl font-semibold"><TrendingUp className="h-5 w-5 shrink-0 text-primary" /> Projeção de receita mensal</h2>
      <p className="text-sm text-muted-foreground">Premissas: {money(content.placementTicket)} por espaço de 30 dias e {money(content.eventTicket)} por patrocínio de 7 dias vendido no mês.</p>
      <div className="w-full overflow-x-auto rounded-lg border border-border" tabIndex={0} aria-label="Projeção mensal por período">
        <table className="w-full min-w-[620px] text-left text-sm">
          <caption className="sr-only">Cenário ilustrativo de vendas e receita dos meses 1, 6 e 12</caption>
          <thead className="bg-muted/50"><tr><th scope="col" className="p-4 font-medium">Vendas e receita</th>{content.scenarios.map((s) => <th scope="col" key={s.month} className="p-4 font-medium">Mês {s.month}</th>)}</tr></thead>
          <tbody>{rows.map((row) => <tr key={row.label} className={row.emphasis ? "border-t border-border bg-muted/30 text-primary" : "border-t border-border"}><th scope="row" className="p-4 font-medium">{row.label}</th>{content.scenarios.map((s) => <td key={s.month} className="whitespace-nowrap p-4 tabular-nums">{row.value(s)}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">* {content.disclaimer}</p>
    </section>
    <section className="space-y-5 border-t border-border pt-8">
      <h2 className="flex items-center gap-2 text-xl font-semibold"><Target className="h-5 w-5 shrink-0 text-primary" /> Aquisição: tráfego pago hiperlocal</h2>
      <p className="text-lg font-medium">Orçamento inicial: <span className="text-primary">{money(content.marketingMin)} a {money(content.marketingMax)}/mês</span></p>
      <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">{content.acquisition.map((item, i) => <div key={item.title} className="space-y-2"><h3 className="font-semibold"><span className="mr-2 text-primary">0{i + 1}</span>{item.title}</h3><p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p></div>)}</div>
    </section>
  </div>;
}
