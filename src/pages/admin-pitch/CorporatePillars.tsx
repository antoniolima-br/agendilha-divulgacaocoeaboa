import { BriefcaseBusiness, Megaphone, ClipboardCheck, Wallet, Code2, ShieldCheck } from "lucide-react";

const pillars = [
  { title: "Comercial", description: "Prospecção, pacotes personalizados, negociação e pós-venda ativo.", icon: BriefcaseBusiness },
  { title: "Marketing", description: "Anúncios, banners de marcas, promoções e acompanhamento do engajamento regional.", icon: Megaphone },
  { title: "Administração", description: "Curadoria de eventos, revisão dos dados e governança da operação.", icon: ClipboardCheck },
  { title: "Financeiro", description: "Conciliação rastreável, pagamentos comprovados e liberação integrada à publicação.", icon: Wallet },
  { title: "Desenvolvimento", description: "Coezinho, leitura inteligente de flyers e evolução da experiência mobile-first.", icon: Code2 },
];

export function CorporatePillars() {
  return <section aria-labelledby="pitch-corporate" className="space-y-6">
    <div className="space-y-2"><h3 id="pitch-corporate" className="text-xl font-semibold">Uma empresa. Cinco pilares integrados.</h3>
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">Estrutura corporativa com responsabilidades claras e painéis inteligentes de gestão por setor.</p></div>
    <ul className="divide-y divide-border">{pillars.map(({ title, description, icon: Icon }) =>
      <li key={title} className="flex min-w-0 items-start gap-4 py-4">
        <Icon aria-hidden="true" className="h-5 w-5 text-primary" />
        <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[10rem_1fr]"><h4 className="text-sm font-semibold">{title}</h4><p className="text-sm leading-relaxed text-muted-foreground">{description}</p></div>
      </li>)}</ul>
    <p className="flex items-start gap-3 border-l-2 border-primary pl-4 text-sm leading-relaxed"><ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>Acesso restrito por setor. <strong className="font-semibold">Master e Sênior</strong> acompanham a visão consolidada dos gestores.</span></p>
  </section>;
}