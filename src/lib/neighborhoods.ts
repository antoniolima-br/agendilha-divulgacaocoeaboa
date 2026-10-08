import { REGIONS, REGION_NEIGHBORHOODS } from "./regions";
/** Bairros centralizados; Freguesia sem qualificação permanece compatível com cadastros históricos. */
export const BAIRROS: readonly string[] = [...new Set([...REGIONS.flatMap((region) => REGION_NEIGHBORHOODS[region]), "Freguesia"])].sort((a, b) => a.localeCompare(b, "pt-BR"));
export type Bairro = string;
export const isBairroValido = (value: string): value is Bairro => BAIRROS.includes(value);
export const PLACEHOLDER_BAIRRO = "Selecione seu bairro";
