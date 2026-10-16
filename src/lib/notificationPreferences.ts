import { BAIRROS } from './neighborhoods';
import { REGIONS, REGION_NEIGHBORHOODS, normalizeGeography, regionOf, type Region } from './regions';
export const NOTIFICATION_INTERESTS = ['Shows', 'Samba', 'Rock', 'Gastronomia', 'Infantil', 'Religioso', 'Esportes', 'Feiras', 'Cultura'] as const;

/** Localidades tradicionais dentro de bairros maiores (sub-bairros), por bairro oficial. */
export const KNOWN_LOCALITIES: Record<string, readonly string[]> = {
 'Ribeira': ['Bananal'],
 'Galeão': ['Tubiacanga'],
 'Portuguesa': ['Barão'],
 'Cacuia': ['Guarabu'],
 'Tauá': ['Dendê'],
 'Ipanema': ['Arpoador'],
 'Gávea': ['Baixo Gávea'],
 'Centro': ['Cinelândia', 'Praça Mauá', 'Saara'],
};
export const LOCALITY_MAX = 10;
export const LOCALITY_MAX_LENGTH = 60;

/** Limpa o nome digitado: sem controles/símbolos estranhos, espaço único, até 60 caracteres. */
export function cleanLocality(input: string): string {
 return input.replace(/[^\p{L}\p{N} '’().,-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, LOCALITY_MAX_LENGTH);
}

/** Bairros de uma região (ou todos) e as localidades conhecidas deles. */
export function geographyOptionsFor(region: Region | 'all') {
 const neighborhoods = region === 'all' ? [...BAIRROS] : [...REGION_NEIGHBORHOODS[region]].sort((a, b) => a.localeCompare(b, 'pt-BR'));
 const localities = neighborhoods.flatMap(n => (KNOWN_LOCALITIES[n] ?? []).map(name => ({ name, neighborhood: n })));
 return { neighborhoods, localities };
}

/** Região dona de uma localidade conhecida, quando houver. */
export function localityRegion(name: string): Region | null {
 const key = normalizeGeography(name);
 for (const [neighborhood, list] of Object.entries(KNOWN_LOCALITIES)) {
  if (list.some(l => normalizeGeography(l) === key)) return regionOf({ address_neighborhood: neighborhood, address_city: 'Rio de Janeiro' });
 }
 return null;
}

export function processGeographies(selections: string[]) {
 const choices = [...new Set(selections)];
 if (!choices.length) throw new Error('Escolha uma região ou bairro.');
 if (choices.includes('all')) {
  if (choices.length > 1) throw new Error('Escolha todas as regiões ou lugares específicos.');
  return { all_regions: true, preferred_regions: [], preferred_neighborhoods: [], preferred_localities: [], preferred_region: null, preferred_neighborhood: null };
 }
 const regions: string[] = [];
 const neighborhoods: string[] = [];
 const localities: string[] = [];
 for (const value of choices) {
  if (value.startsWith('region:') && REGIONS.some(region => region === value.slice(7))) regions.push(value.slice(7));
  else if (value.startsWith('neighborhood:') && BAIRROS.includes(value.slice(13))) neighborhoods.push(value.slice(13));
  else if (value.startsWith('locality:') && cleanLocality(value.slice(9)) === value.slice(9) && value.length > 9) localities.push(value.slice(9));
  else throw new Error('Escolha uma região ou bairro válido.');
 }
 if (localities.length > LOCALITY_MAX) throw new Error(`Escolha até ${LOCALITY_MAX} localidades.`);
 const single = choices.length === 1;
 return { all_regions: false, preferred_regions: regions, preferred_neighborhoods: neighborhoods, preferred_localities: localities,
  preferred_region: single ? regions[0] ?? (neighborhoods[0] ? regionOf({ address_neighborhood: neighborhoods[0], address_city: 'Rio de Janeiro' }) : localityRegion(localities[0])) : null,
  preferred_neighborhood: single ? neighborhoods[0] ?? null : null };
}

export function notificationGeography(selection: string | string[]) {
 return processGeographies(Array.isArray(selection) ? selection : [selection]);
}
