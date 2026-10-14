import { describe,it,expect } from 'vitest';
import { intranetSectors,validCampaignDestination,canViewIntranetOverview } from './intranet';
import { computePermissions } from '@/hooks/useAppPermissions';
import { activeAccessRole } from './access';
import { filterSidebarSections } from '@/components/layout/sidebarItems';
import { routeExists,ROUTES } from '@/routes/config';
describe('intranet isolation',()=>{
 it('shares the management overview with every management role',()=>{for(const role of ['master','senior','admin','comercial','marketing','financeiro','administracao','desenvolvimento'])expect(canViewIntranetOverview([role])).toBe(true);expect(canViewIntranetOverview(['user'])).toBe(false);});
 it.each(['master','senior'])('%s accesses all sectors',role=>expect(intranetSectors([role])).toHaveLength(5));
 it.each(['comercial','marketing','administracao','desenvolvimento'])('%s reads every panel without inheriting operational privileges',role=>{const {permissions}=computePermissions({roleNames:['admin',role],profileRole:'divulgador',collaborator:{is_active:true,can_submit:true,can_edit:true,can_delete:true,can_approve:true}});expect([...permissions]).toEqual(['intranet.read']);expect(intranetSectors(['admin',role])).toHaveLength(5);const menu=filterSidebarSections(activeAccessRole(true,['admin',role]),p=>permissions.has(p),routeExists);expect(menu.flatMap(s=>s.items.map(i=>i.path))).toEqual([ROUTES.INTRANET]);});
 it('legacy admin and finance can view every management panel',()=>{expect(intranetSectors(['admin'])).toHaveLength(5);expect(intranetSectors(['admin','financeiro'])).toHaveLength(5);});
 it('mixed sector roles still expose the unified workspace',()=>expect(intranetSectors(['marketing','comercial'])).toHaveLength(5));
 it('editable profile never grants intranet',()=>expect(computePermissions({roleNames:[],profileRole:'comercial',collaborator:null}).permissions.has('intranet.read')).toBe(false));
 it('validates destinations',()=>{expect(validCampaignDestination('https://example.org/event')).toBe(true);for(const s of ['javascript:alert(1)','http://example.org','https://user:pass@example.org','/agenda'])expect(validCampaignDestination(s)).toBe(false);});
});
