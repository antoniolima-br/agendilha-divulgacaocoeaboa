import { BadgeCheck, ChartNoAxesCombined, Crosshair, Palette, Smartphone, Users, Wallet, type LucideIcon } from "lucide-react";

/** Textos fixos do pitch de anunciantes. */
export const advertiserVisibility: [string, string, LucideIcon][] = [
  ["Público interessado em lazer", "Quem abre o app procura o que fazer: rolês, gastronomia, cultura e experiências em diferentes regiões do Rio, da Zona Sul à Barra, da Zona Norte aos polos culturais.", Users],
  ["Hiperlocalidade: foco na região certa", "Sua campanha pode ser direcionada à região escolhida e acompanhar a pessoa enquanto ela decide para onde ir e o que consumir.", Crosshair],
  ["Flyers e banners em destaque", "Formatos integrados ao fluxo visual do app e pensados para o celular apresentam sua marca com elegância e clareza, sem poluição visual.", Smartphone],
  ["Rastreamento e métricas registradas", "Você acompanha as visualizações e os cliques registrados na sua campanha, por período e origem, conforme os dados coletados.", ChartNoAxesCombined],
];

export const advertiserGains: [string, string, LucideIcon][] = [
  ["Autoridade e desejo", "Estar junto dos rolês divulgados aproxima sua marca de estilo de vida, novidade e experiências cariocas.", BadgeCheck],
  ["Investimento direcionado", "Os pacotes concentram a campanha na região que importa para você. O retorno pode ser avaliado quando seus dados de vendas são relacionados aos registros da campanha.", Wallet],
  ["Suporte criativo", "Nosso Marketing ajuda a desenhar ou adaptar sua arte ao padrão visual da apresentação.", Palette],
];

export const advertiserEngagement: [string, string][] = [
        ["Aberturas de flyer", "Quais rolês despertaram interesse e como esse interesse evoluiu no período."],
        ["Origem e cliques", "Canais registrados ajudam a comparar a divulgação e orientar os próximos ajustes."],
        ["Acompanhamento comercial", "Resultados registrados, contatos e respostas disponíveis apoiam o pós-venda e a renovação."],
];

export const advertiserCloseSteps: [string, string][] = [
        ["Defina sua campanha", "Escolha região, período, formato e destino do anúncio na proposta comercial."],
        ["Alinhe a arte com o Marketing", "Combine criação ou adaptação das peças e entregas do pacote. Sua arte enviada continua preservada."],
];
