import { ArrowRight, MapPin, Megaphone, MousePointerClick, Palette, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/routes/config";
import { PitchChapter } from "./PitchChapter";
import { PitchDetails } from "./PitchDetails";
import { PitchShare } from "./PitchShare";
import type { AdvertiserPitchContent } from "./types";

const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function AdvertiserPitch({ content }: { content: AdvertiserPitchContent }) {
  return <article className="min-w-0" aria-label="Apresentação para anunciantes e divulgadores">
    <section className="space-y-5 py-8">
      <p className="text-xs font-medium uppercase text-primary">Marcas · Patrocinadores · Divulgadores</p>
      <h2 className="text-3xl font-semibold leading-tight">Coé a Boa? · Sua marca no próximo rolê</h2>
      <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">Anuncie no contexto certo: perto de quem procura o que fazer no Rio. Sua campanha ganha região, período e um destino claro para o próximo contato.</p>
      <Button asChild className="h-auto min-h-11 whitespace-normal py-3"><a href={ROUTES.PLANOS_ANUNCIOS}><Megaphone aria-hidden="true" />Escolher meu pacote<ArrowRight aria-hidden="true" /></a></Button>
      <PitchShare audience="advertiser" />
    </section>
    <PitchChapter value="sales-visibility" number="01" title="Visibilidade onde o rolê acontece" eyebrow="Público · Região" icon={MapPin}>
      <ul className="divide-y divide-border">{[
        { title: "A região certa para sua marca", description: "Campanhas com público regional definido. Uma proposta hiperlocal para aproximar negócios e produtores da descoberta de lazer, sem prometer alcance já comprovado.", icon: MapPin },
        { title: "Flyers que merecem ser vistos", description: "Arte original preservada, destaque regional e detalhes do evento no celular. Quem se interessa encontra local, horário e opções de compartilhamento.", icon: Smartphone },
        { title: "Do flyer à publicação", description: "Envie sua arte; o Coezinho sugere dados para revisão. O preenchimento manual continua disponível e a Curadoria aprova antes da publicação.", icon: Megaphone },
      ].map(({ title, description, icon: Icon }) => <li key={title} className="flex min-w-0 items-start gap-4 py-5"><Icon aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-primary" /><div className="min-w-0 space-y-2"><h3 className="text-lg font-semibold">{title}</h3><p className="max-w-3xl leading-relaxed text-muted-foreground">{description}</p></div></li>)}</ul>
    </PitchChapter>
    <PitchChapter value="sales-engagement" number="02" title="Interesse registrado, campanha acompanhada" eyebrow="Engajamento · Pós-venda" icon={MousePointerClick}>
      <p className="max-w-3xl leading-relaxed text-muted-foreground">Não fique só na distribuição da arte. Acompanhe aberturas de flyer e cliques registrados por rolê, período e canal de origem, conforme os dados coletados.</p>
      <dl className="divide-y divide-border">{[
        ["Aberturas de flyer", "Quais rolês despertaram interesse e como esse interesse evoluiu no período."],
        ["Origem e cliques", "Canais registrados ajudam a comparar a divulgação e orientar os próximos ajustes."],
        ["Acompanhamento comercial", "Resultados registrados, contatos e respostas disponíveis apoiam o pós-venda e a renovação."],
      ].map(([title, description]) => <div key={title} className="grid gap-2 py-4 sm:grid-cols-[12rem_1fr]"><dt className="font-semibold">{title}</dt><dd className="leading-relaxed text-muted-foreground">{description}</dd></div>)}</dl>
      <p className="border-l-2 border-primary pl-4 text-sm leading-relaxed text-muted-foreground">Aberturas não são pessoas únicas nem vendas. RSVP não comprova presença. ROI depende de receita atribuível e custos completos; números da sua campanha entram no acompanhamento, sem estimativas apresentadas como resultados reais.</p>
    </PitchChapter>
    <PitchChapter value="sales-packages" number="03" title="Um formato para sua campanha" eyebrow="Pacotes · Patrocínio" icon={Megaphone}>
      <p className="max-w-3xl leading-relaxed text-muted-foreground">Destaque seu evento ou mantenha sua marca na descoberta local. Comercial define a proposta; Marketing alinha as artes e acompanha a campanha.</p>
      <dl className="divide-y divide-border">{content.formats.map((format) => <div key={format.title} className="space-y-2 py-5"><dt className="text-lg font-semibold">{format.title}</dt><dd className="flex flex-wrap justify-between gap-3"><span className="text-sm text-muted-foreground">{format.cycle}</span><span className="font-semibold text-primary">{money(format.min)} a {money(format.max)} {format.priceSuffix}</span></dd></div>)}</dl>
      <PitchDetails><p className="text-sm leading-relaxed text-muted-foreground">Preços sugeridos; confirme disponibilidade, região, período e entregas na proposta. Master e Sub-Masters seguem condições mensais. Formatos propostos não significam ativação automática.</p><p className="text-sm leading-relaxed text-muted-foreground">Push regional é uma proposta sujeita a implantação e consentimento: {money(content.pushTicket)} por envio; {content.push.packageSends} envios por {money(content.push.packagePrice)}. Não há disparos ativados por esta apresentação.</p></PitchDetails>
    </PitchChapter>
    <PitchChapter value="sales-close" number="04" title="Vamos colocar sua campanha de pé?" eyebrow="Contratação · Próximo passo" icon={Palette}>
      <ol className="space-y-5">{[
        ["Defina sua campanha", "Escolha região, período, formato e destino do anúncio na proposta comercial."],
        ["Alinhe a arte com o Marketing", "Combine criação ou adaptação das peças e entregas do pacote. Sua arte enviada continua preservada."],
        ["Confirme e acompanhe", "Publicação paga exige pagamento comprovado e aprovação. Depois, acompanhe o engajamento registrado com o time."],
      ].map(([title, description], index) => <li key={title} className="space-y-2 border-t border-border pt-4"><p className="text-xs font-semibold text-primary">0{index + 1}</p><h3 className="text-lg font-semibold">{title}</h3><p className="max-w-3xl leading-relaxed text-muted-foreground">{description}</p></li>)}</ol>
      <div className="flex flex-wrap gap-3"><Button asChild className="h-auto min-h-11 whitespace-normal py-3"><a href={ROUTES.PLANOS_ANUNCIOS}><Megaphone aria-hidden="true" />Quero patrocinar<ArrowRight aria-hidden="true" /></a></Button><Button asChild variant="outline" className="h-auto min-h-11 whitespace-normal py-3"><a href={ROUTES.MEUS_EVENTOS}>Divulgar meu evento<ArrowRight aria-hidden="true" /></a></Button></div>
      <PitchShare audience="advertiser" />
    </PitchChapter>
    <footer className="border-t border-border py-6 text-xs leading-relaxed text-muted-foreground">Proposta comercial sujeita a disponibilidade e aprovação. Sem garantia de alcance, presença ou vendas. Dados pessoais e relatórios internos continuam protegidos.</footer>
  </article>;
}