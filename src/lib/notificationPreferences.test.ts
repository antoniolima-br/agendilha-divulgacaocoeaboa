import { describe, expect, it } from 'vitest';
import { notificationGeography } from './notificationPreferences';
import { newsletterSubscribeSchema } from '@/schemas/newsletter';
describe('notification preferences', () => {
 it('keeps all regions explicit', () => { expect(notificationGeography('all')).toEqual({all_regions:true,preferred_region:null,preferred_neighborhood:null}); });
 it('persists a macro-region', () => { expect(notificationGeography('region:Zona Sul')).toEqual({all_regions:false,preferred_region:'Zona Sul',preferred_neighborhood:null}); });
 it('preserves neighborhood targeting', () => { expect(notificationGeography('neighborhood:Olaria')).toEqual({all_regions:false,preferred_region:'Zona Norte',preferred_neighborhood:'Olaria'}); });
  it('keeps interests alongside geography', () => { const d=newsletterSubscribeSchema.parse({phone:'21999887766',geography:['region:Centro', 'region:Zona Sul'],interests:['Samba','Rock','Gastronomia'],whatsappConsent:true}); expect(d.interests).toEqual(['Samba','Rock','Gastronomia']); expect(d.geography).toEqual(['region:Centro', 'region:Zona Sul']); });
  it('preserves multiple regions and neighborhoods without widening neighborhood targeting', () => { expect(notificationGeography(['region:Zona Sul', 'region:Centro', 'neighborhood:Olaria', 'neighborhood:Ramos'])).toEqual({all_regions:false,preferred_region:null,preferred_neighborhood:null,preferred_regions:['Zona Sul','Centro'],preferred_neighborhoods:['Olaria','Ramos']}); });
  it('makes all regions exclusive', () => { expect(notificationGeography(['all'])).toEqual({all_regions:true,preferred_region:null,preferred_neighborhood:null,preferred_regions:[],preferred_neighborhoods:[]}); expect(() => notificationGeography(['all','region:Centro'])).toThrow(); });
  it('rejects empty or invalid multiple selections', () => { expect(() => notificationGeography([])).toThrow(); expect(() => notificationGeography(['region:Centro','region:invalid'])).toThrow(); });
 it('rejects invalid geography', () => { expect(() => notificationGeography('region:invalid')).toThrow(); });
});
