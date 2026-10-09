import { describe, expect, it } from 'vitest';
import { notificationGeography } from './notificationPreferences';
import { newsletterSubscribeSchema } from '@/schemas/newsletter';
describe('notification preferences', () => {
 it('keeps all regions explicit', () => { expect(notificationGeography('all')).toEqual({all_regions:true,preferred_region:null,preferred_neighborhood:null}); });
 it('persists a macro-region', () => { expect(notificationGeography('region:Zona Sul')).toEqual({all_regions:false,preferred_region:'Zona Sul',preferred_neighborhood:null}); });
 it('preserves neighborhood targeting', () => { expect(notificationGeography('neighborhood:Olaria')).toEqual({all_regions:false,preferred_region:'Zona Norte',preferred_neighborhood:'Olaria'}); });
 it('keeps interests alongside geography', () => { const d=newsletterSubscribeSchema.parse({phone:'21999887766',geography:'region:Centro',interests:['Samba','Rock','Gastronomia'],whatsappConsent:true}); expect(d.interests).toEqual(['Samba','Rock','Gastronomia']); expect(d.geography).toBe('region:Centro'); });
 it('rejects invalid geography', () => { expect(() => notificationGeography('region:invalid')).toThrow(); });
});
