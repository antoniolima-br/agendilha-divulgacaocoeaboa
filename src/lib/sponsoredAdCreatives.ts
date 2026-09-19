import cervejeirosFreguesia from "@/assets/ad-cervejeiros-freguesia.jpg";
import pimentaCariocaRibeira from "@/assets/ad-pimenta-carioca-ribeira.jpg";

const FICTIONAL_AD_CREATIVES: Array<{ match: string; image: string }> = [
  { match: "cervejeiros", image: cervejeirosFreguesia },
  { match: "pimenta carioca", image: pimentaCariocaRibeira },
];

export function getSponsoredAdCreative(title: string): string | undefined {
  const normalizedTitle = title.toLocaleLowerCase("pt-BR");
  return FICTIONAL_AD_CREATIVES.find(({ match }) => normalizedTitle.includes(match))?.image;
}