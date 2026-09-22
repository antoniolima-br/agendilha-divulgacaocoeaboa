import cervejeirosFreguesia from "@/assets/ad-cervejeiros-freguesia.webp";
import pimentaCariocaRibeira from "@/assets/ad-pimenta-carioca-ribeira.webp";

const FICTIONAL_AD_CREATIVES: Array<{ match: string; image: string }> = [
  { match: "cervejeiros", image: cervejeirosFreguesia },
  { match: "pimenta carioca", image: pimentaCariocaRibeira },
];

export function getSponsoredAdCreative(title: string): string | undefined {
  const normalizedTitle = title.toLocaleLowerCase("pt-BR");
  return FICTIONAL_AD_CREATIVES.find(({ match }) => normalizedTitle.includes(match))?.image;
}