import { describe,it,expect } from 'vitest';
import { intranetSectors,validCampaignDestination,canViewIntranetOverview } from './intranet';
import { computePermissions } from '@/hooks/useAppPermissions';
import { activeAccessRole } from './access';
import { filterSidebarSections } from '@/components/layout/sidebarItems';
import { routeExists,ROUTES } from '@/routes/config';
describe('intranet isolation',()=>{
 it('reserves the management overview for senior and master',()=>{expect(canViewIntranetOverview(['senior'])).toBe(true);expect(canViewIntranetOverview(['master'])).toBe(true);for(const role of ['admin','comercial','marketing','financeiro','administracao','desenvolvimento'])expect(canViewIntranetOverview([role])).toBe(false);});
 it.each(['master','senior'])('%s accesses all sectors',role=>expect(intranetSectors([role])).toHaveLength(5));
 it.each(['comercial','marketing','administracao','desenvolvimento'])('%s does not inherit admin or editable profile privileges',role=>{const {permissions}=computePermissions({roleNames:['admin',role],profileRole:'divulgador',collaborator:{is_active:true,can_submit:true,can_edit:true,can_delete:true,can_approve:true}});expect([...permissions]).toEqual(['intranet.read']);expect(intranetSectors(['admin',role])).toEqual([role]);const menu=filterSidebarSections(activeAccessRole(true,['admin',role]),p=>permissions.has(p),routeExists);expect(menu.flatMap(s=>s.items.map(i=>i.path))).toEqual([ROUTES.INTRANET]);});
 it('legacy admin defaults to administration and finance stays separate',()=>{expect(intranetSectors(['admin'])).toEqual(['administracao']);expect(intranetSectors(['admin','financeiro'])).toEqual(['financeiro']);});
 it('mixed sector roles expose one effective sector',()=>expect(intranetSectors(['marketing','comercial'])).toEqual(['comercial']));
 it('editable profile never grants intranet',()=>expect(computePermissions({roleNames:[],profileRole:'comercial',collaborator:null}).permissions.has('intranet.read')).toBe(false));
 it('validates destinations',()=>{expect(validCampaignDestination('https://example.org/event')).toBe(true);for(const s of ['javascript:alert(1)','http://example.org','https://user:pass@example.org','/agenda'])expect(validCampaignDestination(s)).toBe(false);});
});
