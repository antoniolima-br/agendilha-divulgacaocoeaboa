import type { PitchContent } from "./types";

export const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
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

/** Tabela de projeção mensal de receita por fase. */
export function PitchProjectionTable({ scenarios }: { scenarios: Scenario[] }) {
  const content = { scenarios };
  return <div className="w-full overflow-x-auto rounded-lg border border-primary/30 bg-card" tabIndex={0} aria-label="Projeção mensal por período"><table className="w-full min-w-[620px] text-left text-sm"><caption className="sr-only">Cenário ilustrativo de vendas e receita dos meses 1, 6 e 12</caption><thead className="bg-primary/10"><tr><th scope="col" className="p-4 font-medium">Vendas e receita</th>{content.scenarios.map((s) => <th scope="col" key={s.month} className="p-4 font-medium"><span className="block">{s.phase}</span><span className="text-xs text-muted-foreground">Mês {s.month}</span></th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.label} className={row.emphasis ? "border-t border-border bg-primary/10 text-primary" : "border-t border-border"}><th scope="row" className="p-4 font-medium">{row.label}</th>{content.scenarios.map((s) => <td key={s.month} className="whitespace-nowrap p-4 tabular-nums">{row.value(s)}</td>)}</tr>)}</tbody></table></div>;
}
