import { BAIRROS } from './neighborhoods';
import { REGIONS, regionOf } from './regions';
export const NOTIFICATION_INTERESTS = ['Shows', 'Samba', 'Rock', 'Gastronomia', 'Infantil', 'Religioso', 'Esportes', 'Feiras', 'Cultura'] as const;
export function notificationGeography(selection: string) {
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
