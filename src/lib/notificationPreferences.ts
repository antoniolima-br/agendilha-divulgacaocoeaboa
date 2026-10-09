import { BAIRROS } from './neighborhoods';
import { REGIONS, regionOf } from './regions';
export const NOTIFICATION_INTERESTS = ['Shows', 'Samba', 'Rock', 'Gastronomia', 'Infantil', 'Religioso', 'Esportes', 'Feiras', 'Cultura'] as const;
export function notificationGeography(selection: string | string[]) {
  if (Array.isArray(selection)) {
    const choices = [...new Set(selection)];
    if (!choices.length) throw new Error('Escolha uma região ou bairro.');
    if (choices.includes('all')) {
      if (choices.length > 1) throw new Error('Escolha todas as regiões ou lugares específicos.');
      return { all_regions: true, preferred_region: null, preferred_neighborhood: null, preferred_regions: [], preferred_neighborhoods: [] };
    }
    choices.forEach(choice => notificationGeography(choice));
    const preferred_regions = choices.filter(choice => choice.startsWith('region:')).map(choice => choice.slice(7));
    const preferred_neighborhoods = choices.filter(choice => choice.startsWith('neighborhood:')).map(choice => choice.slice(13));
    const legacy = choices.length === 1 ? notificationGeography(choices[0]) : { preferred_region: null, preferred_neighborhood: null };
    return { all_regions: false, preferred_region: legacy.preferred_region, preferred_neighborhood: legacy.preferred_neighborhood, preferred_regions, preferred_neighborhoods };
  }
  if (selection === 'all') return { all_regions: true, preferred_region: null, preferred_neighborhood: null };
  if (selection.startsWith('region:')) {
    const region = selection.slice(7);
    if (!REGIONS.some(r => r === region)) throw new Error('Escolha uma região válida.');
    return { all_regions: false, preferred_region: region, preferred_neighborhood: null };
  }
  const neighborhood = selection.startsWith('neighborhood:') ? selection.slice(13) : '';
  if (!BAIRROS.includes(neighborhood)) throw new Error('Escolha uma região ou bairro.');
  return { all_regions: false, preferred_region: regionOf({ address_neighborhood: neighborhood, address_city: 'Rio de Janeiro' }), preferred_neighborhood: neighborhood };
}
