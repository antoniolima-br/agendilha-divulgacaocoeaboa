import { describe,it,expect } from 'vitest';
import { assignedIntranetSector, intranetSectors, isAdministrativeMember, SECTOR_SHORTCUTS, validCampaignDestination, canViewIntranetOverview } from './intranet';
import { computePermissions } from '@/hooks/useAppPermissions';
import { activeAccessRole } from './access';
import { filterSidebarSections } from '@/components/layout/sidebarItems';
import { routeExists,ROUTES } from '@/routes/config';
describe('intranet isolation',()=>{
 it('reserves the management overview for Master',()=>{expect(canViewIntranetOverview(['master'])).toBe(true);for(const role of ['senior','admin','comercial','marketing','financeiro','administracao','desenvolvimento','user'])expect(canViewIntranetOverview([role])).toBe(false);});
 it('Master accesses all sectors',()=>expect(intranetSectors(['master'])).toHaveLength(5));
 it.each(['senior','admin','financeiro','comercial','marketing','administracao','desenvolvimento'])('%s cannot access the hidden workspace',role=>{const {permissions}=computePermissions({roleNames:[role],profileRole:null,collaborator:null});expect(permissions.has('intranet.read')).toBe(false);expect(intranetSectors([role])).toHaveLength(0);const menu=filterSidebarSections(activeAccessRole(true,[role]),p=>permissions.has(p),routeExists);expect(menu.flatMap(s=>s.items.map(i=>i.path))).not.toContain(ROUTES.INTRANET);});
 it('shows dedicated shortcuts for the four operational departments',()=>expect(SECTOR_SHORTCUTS).toEqual(['comercial','marketing','administracao','financeiro']));
 it('recognizes only administrative members and their assigned sector',()=>{expect(isAdministrativeMember(['user'])).toBe(false);expect(isAdministrativeMember(['admin'])).toBe(true);expect(assignedIntranetSector(['admin'])).toBe('administracao');expect(assignedIntranetSector(['marketing'])).toBe('marketing');expect(assignedIntranetSector(['user'])).toBeNull();});
 it('only the protected Master role grants intranet',()=>{expect(computePermissions({roleNames:['master'],profileRole:null,collaborator:null}).permissions.has('intranet.read')).toBe(true);expect(computePermissions({roleNames:[],profileRole:'comercial',collaborator:null}).permissions.has('intranet.read')).toBe(false);});
 it('validates destinations',()=>{expect(validCampaignDestination('https://example.org/event')).toBe(true);for(const s of ['javascript:alert(1)','http://example.org','https://user:pass@example.org','/agenda'])expect(validCampaignDestination(s)).toBe(false);});
});
