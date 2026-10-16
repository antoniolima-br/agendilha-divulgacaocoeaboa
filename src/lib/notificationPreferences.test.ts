import { describe, expect, it } from 'vitest';
import { notificationGeography } from './notificationPreferences';
import { newsletterSubscribeSchema } from '@/schemas/newsletter';
describe('notification preferences', () => {
 it('keeps all regions explicit', () => { expect(notificationGeography('all')).toEqual({all_regions:true,preferred_region:null,preferred_neighborhood:null,preferred_regions:[],preferred_neighborhoods:[],preferred_localities:[]}); });
 it('persists a macro-region', () => { expect(notificationGeography('region:Zona Sul')).toEqual({all_regions:false,preferred_region:'Zona Sul',preferred_neighborhood:null,preferred_regions:['Zona Sul'],preferred_neighborhoods:[],preferred_localities:[]}); });
 it('preserves neighborhood targeting', () => { expect(notificationGeography('neighborhood:Olaria')).toEqual({all_regions:false,preferred_region:'Zona Norte',preferred_neighborhood:'Olaria',preferred_regions:[],preferred_neighborhoods:['Olaria'],preferred_localities:[]}); });
  it('keeps interests alongside geography', () => { const d=newsletterSubscribeSchema.parse({phone:'21999887766',geographies:['region:Centro', 'region:Zona Sul'],interests:['Samba','Rock','Gastronomia'],whatsappConsent:true}); expect(d.interests).toEqual(['Samba','Rock','Gastronomia']); expect(d.geographies).toEqual(['region:Centro', 'region:Zona Sul']); });
  it('preserves multiple regions and neighborhoods without widening neighborhood targeting', () => { expect(notificationGeography(['region:Zona Sul', 'region:Centro', 'neighborhood:Olaria', 'neighborhood:Ramos'])).toEqual({all_regions:false,preferred_region:null,preferred_neighborhood:null,preferred_regions:['Zona Sul','Centro'],preferred_neighborhoods:['Olaria','Ramos'],preferred_localities:[]}); });
  it('makes all regions exclusive', () => { expect(notificationGeography(['all'])).toEqual({all_regions:true,preferred_region:null,preferred_neighborhood:null,preferred_regions:[],preferred_neighborhoods:[],preferred_localities:[]}); expect(() => notificationGeography(['all','region:Centro'])).toThrow(); });
  it('rejects empty or invalid multiple selections', () => { expect(() => notificationGeography([])).toThrow(); expect(() => notificationGeography(['region:Centro','region:invalid'])).toThrow(); });
 it('rejects invalid geography', () => { expect(() => notificationGeography('region:invalid')).toThrow(); });
 it('accepts custom localities for micro-region targeting', () => { const g=notificationGeography(['locality:Bananal']); expect(g.preferred_localities).toEqual(['Bananal']); expect(g.preferred_region).toBe('Ilha do Governador'); expect(notificationGeography(['locality:Morro do Céu']).preferred_localities).toEqual(['Morro do Céu']); expect(() => notificationGeography(['locality:<script>'])).toThrow(); });
});
