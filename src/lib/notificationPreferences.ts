import { BAIRROS } from './neighborhoods';
import { REGIONS, regionOf } from './regions';

export const NOTIFICATION_INTERESTS = ['Shows', 'Samba', 'Rock', 'Gastronomia', 'Infantil', 'Religioso', 'Esportes', 'Feiras', 'Cultura'] as const;

export function processGeographies(selections: string[]) {
  if (selections.includes('all') || selections.length === 0) {
    return { 
      all_regions: true, 
      preferred_regions: [], 
      preferred_neighborhoods: [],
      preferred_region: null,
      preferred_neighborhood: null
    };
  }

  const regions: string[] = [];
  const neighborhoods: string[] = [];

  selections.forEach(s => {
    if (s.startsWith('region:')) {
      const r = s.slice(7);
      if (REGIONS.includes(r as any)) regions.push(r);
    } else if (s.startsWith('neighborhood:')) {
      const n = s.slice(13);
      if (BAIRROS.includes(n)) neighborhoods.push(n);
    }
  });

  return {
    all_regions: false,
    preferred_regions: regions,
    preferred_neighborhoods: neighborhoods,
    // Maintain single fields for backward compatibility using the first selection
    preferred_region: regions[0] || (neighborhoods[0] ? regionOf({ address_neighborhood: neighborhoods[0], address_city: 'Rio de Janeiro' }) : null),
    preferred_neighborhood: neighborhoods[0] || null
  };
}

/** @deprecated Use processGeographies instead */
export function notificationGeography(selection: string) {
  return processGeographies([selection]);
}
