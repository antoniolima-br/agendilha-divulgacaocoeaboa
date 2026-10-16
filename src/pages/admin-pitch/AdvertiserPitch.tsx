import { ArrowRight, MapPin, Megaphone, MessageCircle, MousePointerClick, Sparkles, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SETTING_KEYS, settingOr, useAppSettings } from "@/data/useAppSettings";
import { buildWhatsappUrl } from "@/lib/whatsapp";
import { PitchChapter } from "./PitchChapter";
import { AdvertiserPdfButton } from "./AdvertiserPdfButton";
import type { AdvertiserPitchContent } from "./types";
import { advertiserCloseSteps, advertiserEngagement, advertiserGains, advertiserVisibility } from "./advertiserPitchCopy";

const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
const commercialMessage = "Oi! Vi a apresentação do Coé a Boa? e quero anunciar minha marca. Podemos conversar sobre região, período e formato?";

function CommercialWhatsappButton() {
  const { data: settings } = useAppSettings();
  const phone = settingOr(settings, SETTING_KEYS.teamWhatsapp);
  const href = (phone && buildWhatsappUrl(phone, commercialMessage)) || `https://wa.me/?text=${encodeURIComponent(commercialMessage)}`;
  return <Button asChild size="lg" className="h-auto min-h-12 whitespace-normal py-3"><a href={href} target="_blank" rel="noopener noreferrer"><MessageCircle aria-hidden="true" />Fale com o Comercial no WhatsApp<ArrowRight aria-hidden="true" /></a></Button>;
}

const item = (title: string, description: string, Icon: typeof MapPin) => <li key={title} className="flex min-w-0 items-start gap-4 py-5"><Icon aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-primary" /><div className="min-w-0 space-y-2"><h3 className="text-lg font-semibold">{title}</h3><p className="max-w-3xl leading-relaxed text-muted-foreground">{description}</p></div></li>;

export function AdvertiserPitch({ content }: { content: AdvertiserPitchContent }) {
  return <article data-advertiser-pitch className="min-w-0" aria-label="Apresentação para anunciantes e divulgadores">
    <section className="space-y-5 py-8">
      <p className="text-xs font-medium uppercase text-primary">Marcas · Patrocinadores · Divulgadores</p>
      <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">Anuncie no Coé a Boa?</h2>
      <p className="max-w-3xl text-xl font-medium leading-relaxed">Onde o Rio de Janeiro vai, a sua marca está.</p>
      <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">O Coé a Boa? é um ecossistema digital de descoberta de eventos e entretenimento do Rio de Janeiro. Mais do que uma agenda, é um ponto de encontro para quem procura o próximo rolê.</p>
      <p className="max-w-3xl leading-relaxed text-muted-foreground">Se a sua marca busca visibilidade com contexto e conexão com quem vive a cultura carioca, este espaço foi pensado para você.</p>
    </section>
    <PitchChapter value="sales-visibility" number="01" title="Por que anunciar no Coé a Boa?" eyebrow="Público · Região" icon={MapPin}>
      <ul className="divide-y divide-border">{advertiserVisibility.map(([title, description, Icon]) => item(title, description, Icon))}</ul>
    </PitchChapter>
    <PitchChapter value="sales-gains" number="02" title="O que sua marca ganha" eyebrow="Valor · Parceria" icon={Sparkles}>
      <ul className="divide-y divide-border">{advertiserGains.map(([title, description, Icon]) => item(title, description, Icon))}</ul>
    </PitchChapter>
    <PitchChapter value="sales-engagement" number="03" title="Interesse registrado, campanha acompanhada" eyebrow="Engajamento · Pós-venda" icon={MousePointerClick}>
      <p className="max-w-3xl leading-relaxed text-muted-foreground">Não fique só na distribuição da arte. Acompanhe aberturas de flyer e cliques registrados por rolê, período e canal de origem, conforme os dados coletados.</p>
      <dl className="divide-y divide-border">{advertiserEngagement.map(([title, description]) => <div key={title} className="grid gap-2 py-4 sm:grid-cols-[12rem_1fr]"><dt className="font-semibold">{title}</dt><dd className="leading-relaxed text-muted-foreground">{description}</dd></div>)}</dl>
      <p className="border-l-2 border-primary pl-4 text-sm leading-relaxed text-muted-foreground">Aberturas não são pessoas únicas nem vendas. RSVP não comprova presença. ROI depende de receita atribuível e custos completos; números da sua campanha entram no acompanhamento, sem estimativas apresentadas como resultados reais.</p>
    </PitchChapter>
    <PitchChapter value="sales-packages" number="04" title="Um formato para sua campanha" eyebrow="Pacotes · Patrocínio" icon={Megaphone}>
      <p className="max-w-3xl leading-relaxed text-muted-foreground">Destaque seu evento ou mantenha sua marca na descoberta local. Comercial define a proposta; Marketing alinha as artes e acompanha a campanha.</p>
      <dl className="divide-y divide-border">{content.formats.map((format) => <div key={format.title} className="space-y-2 py-5"><dt className="text-lg font-semibold">{format.title}</dt><dd className="flex flex-wrap justify-between gap-3"><span className="text-sm text-muted-foreground">{format.cycle}</span><span className="font-semibold text-primary">{money(format.min)} a {money(format.max)} {format.priceSuffix}</span></dd></div>)}</dl>
      <p className="text-sm leading-relaxed text-muted-foreground">Preços sugeridos; confirme disponibilidade, região, período e entregas na proposta. Master e Sub-Masters seguem condições mensais. Formatos propostos não significam ativação automática.</p>
      <p className="text-sm leading-relaxed text-muted-foreground">Push regional é uma proposta sujeita a implantação e consentimento: {money(content.pushTicket)} por envio; {content.push.packageSends} envios por {money(content.push.packagePrice)}. Não há disparos ativados por esta apresentação.</p>
    </PitchChapter>
    <PitchChapter value="sales-close" number="05" title="Vamos fechar essa parceria?" eyebrow="Contratação · Próximo passo" icon={MessageCircle}>
      <p className="max-w-3xl text-lg leading-relaxed">Converse com o Comercial para escolher região, período e formato e aproximar sua marca de quem procura o que fazer no Rio de Janeiro.</p>
      <ol className="space-y-5">{advertiserCloseSteps.map(([title, description], index) => <li key={title} className="space-y-2 border-t border-border pt-4"><p className="text-xs font-semibold text-primary">0{index + 1}</p><h3 className="text-lg font-semibold">{title}</h3><p className="max-w-3xl leading-relaxed text-muted-foreground">{description}</p></li>)}</ol>
    </PitchChapter>
    <footer className="space-y-6 border-t border-border py-8">
      <p data-pdf-note className="text-xs leading-relaxed text-muted-foreground">Proposta comercial sujeita a disponibilidade e aprovação. Sem garantia de alcance, presença ou vendas. Dados pessoais e relatórios internos continuam protegidos.</p>
      <div data-pdf-exclude className="flex flex-col items-start gap-2">
        <CommercialWhatsappButton />
        <AdvertiserPdfButton />
      </div>
    </footer>
  </article>;
}