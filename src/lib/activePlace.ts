import { REGIONS, normalizeGeography } from "@/lib/regions";

/** Nome do lugar ativo pra títulos: bairro > região > "no Rio". */
export function activePlaceLabel(region: string | null | undefined, neighborhood: string | null | undefined): string {
  const nbh = (neighborhood ?? "").trim();
  if (nbh && nbh !== "all") return nbh;
  const reg = (region ?? "").trim();
  if (reg && reg !== "all") return reg;
  return "Rio";
}

/** "em Tijuca", "na Zona Sul", "no Rio" — preposição simples pra caber nos títulos. */
export function activePlacePhrase(region: string | null | undefined, neighborhood: string | null | undefined): string {
  const label = activePlaceLabel(region, neighborhood);
  if (label === "Rio" || label === "Centro" || label === "Méier") return `no ${label}`;
  if (/^(Zona|Ilha|Grande|Barra|Penha)\b/.test(label)) return `na ${label}`;
  return `em ${label}`;
}

/** Primeira região seguida no Meu Radar que existe na lista de regiões do app. */
export function radarDefaultRegion(followed: readonly string[] | null | undefined): string | null {
  for (const value of followed ?? []) {
    const match = REGIONS.find((r) => normalizeGeography(r) === normalizeGeography(String(value)));
    if (match) return match;
  }
  return null;
}

/** A Home adota a região do Radar uma única vez por abertura; depois a pessoa troca à vontade. */
let radarApplied = false;
export const radarRegionOnce = {
  pending: () => !radarApplied,
  done: () => { radarApplied = true; },
  reset: () => { radarApplied = false; },
};
