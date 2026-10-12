import { BriefcaseBusiness, Megaphone, ClipboardCheck, Wallet, Code2, ShieldCheck } from "lucide-react";

const pillars = [
  { title: "Comercial", description: "Parceiros, propostas e inventário publicitário.", icon: BriefcaseBusiness },
  { title: "Marketing", description: "Campanhas, comunidade e aquisição regional.", icon: Megaphone },
  { title: "Administração", description: "Curadoria, cadastros e organização da operação.", icon: ClipboardCheck },
  { title: "Financeiro", description: "Receitas, despesas e acompanhamento de cobranças.", icon: Wallet },
  { title: "Desenvolvimento", description: "Tecnologia, qualidade e evolução do produto.", icon: Code2 },
];

export function CorporatePillars() {
  return <section aria-labelledby="pitch-corporate" className="space-y-6">
    <div className="space-y-2"><h3 id="pitch-corporate" className="text-xl font-semibold">Uma empresa. Cinco pilares integrados.</h3>
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">Estrutura corporativa com responsabilidades claras e painéis inteligentes de gestão por setor.</p></div>
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{pillars.map(({ title, description, icon: Icon }) =>
      <li key={title} className="min-w-0 space-y-4 rounded-lg border border-border bg-card p-5">
        <Icon aria-hidden="true" className="h-5 w-5 text-primary" />
        <div className="space-y-2"><h4 className="text-sm font-semibold">{title}</h4><p className="text-sm leading-relaxed text-muted-foreground">{description}</p></div>
      </li>)}</ul>
    <p className="flex items-start gap-3 border-l-2 border-primary pl-4 text-sm leading-relaxed"><ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>Acesso restrito por setor. <strong className="font-semibold">Master e Sênior</strong> acompanham a visão consolidada dos gestores.</span></p>
  </section>;
}