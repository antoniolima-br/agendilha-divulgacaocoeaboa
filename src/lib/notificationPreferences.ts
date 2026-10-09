import { BAIRROS } from './neighborhoods';
import { REGIONS, regionOf } from './regions';
export const NOTIFICATION_INTERESTS = ['Shows', 'Samba', 'Rock', 'Gastronomia', 'Infantil', 'Religioso', 'Esportes', 'Feiras', 'Cultura'] as const;

export function processGeographies(selections: string[]) {
 const choices = [...new Set(selections)];
 if (!choices.length) throw new Error('Escolha uma região ou bairro.');
 if (choices.includes('all')) {
  if (choices.length > 1) throw new Error('Escolha todas as regiões ou lugares específicos.');
  return { all_regions: true, preferred_regions: [], preferred_neighborhoods: [], preferred_region: null, preferred_neighborhood: null };
 }
 const regions: string[] = [];
 const neighborhoods: string[] = [];
 for (const value of choices) {
  if (value.startsWith('region:') && REGIONS.some(region => region === value.slice(7))) regions.push(value.slice(7));
  else if (value.startsWith('neighborhood:') && BAIRROS.includes(value.slice(13))) neighborhoods.push(value.slice(13));
  else throw new Error('Escolha uma região ou bairro válido.');
 }
 return { all_regions: false, preferred_regions: regions, preferred_neighborhoods: neighborhoods,
  preferred_region: choices.length === 1 ? regions[0] ?? regionOf({ address_neighborhood: neighborhoods[0], address_city: 'Rio de Janeiro' }) : null,
  preferred_neighborhood: choices.length === 1 ? neighborhoods[0] ?? null : null };
}

export function notificationGeography(selection: string | string[]) {
 return processGeographies(Array.isArray(selection) ? selection : [selection]);
}
