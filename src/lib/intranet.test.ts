import { describe,it,expect } from 'vitest';
import { assignedIntranetSector, intranetSectors, isAdministrativeMember, SECTOR_SHORTCUTS, validCampaignDestination, canViewIntranetOverview } from './intranet';
import { computePermissions } from '@/hooks/useAppPermissions';
import { activeAccessRole } from './access';
import { filterSidebarSections } from '@/components/layout/sidebarItems';
import { routeExists,ROUTES } from '@/routes/config';
describe('intranet isolation',()=>{
 it('every partner reads the BI and all sectors',()=>{for(const role of ['master','senior','comercial','marketing','financeiro','administracao','desenvolvimento']){expect(canViewIntranetOverview([role])).toBe(true);expect(intranetSectors([role])).toHaveLength(5);expect(computePermissions({roleNames:[role],profileRole:null,collaborator:null}).permissions.has('intranet.read')).toBe(true);}});
 it('common admins and public users stay out',()=>{for(const role of ['admin','user'])expect(canViewIntranetOverview([role])).toBe(false);});
 it('Master accesses all sectors',()=>expect(intranetSectors(['master'])).toHaveLength(5));
 it.each(['admin','user'])('%s cannot access the hidden workspace',role=>{const {permissions}=computePermissions({roleNames:[role],profileRole:null,collaborator:null});expect(permissions.has('intranet.read')).toBe(false);expect(intranetSectors([role])).toHaveLength(0);const menu=filterSidebarSections(activeAccessRole(true,[role]),p=>permissions.has(p),routeExists);expect(menu.flatMap(s=>s.items.map(i=>i.path))).not.toContain(ROUTES.INTRANET);});
 it('shows dedicated shortcuts for the four operational departments',()=>expect(SECTOR_SHORTCUTS).toEqual(['comercial','marketing','administracao','financeiro']));
 it('recognizes only administrative members and their assigned sector',()=>{expect(isAdministrativeMember(['user'])).toBe(false);expect(isAdministrativeMember(['admin'])).toBe(true);expect(assignedIntranetSector(['admin'])).toBe('administracao');expect(assignedIntranetSector(['marketing'])).toBe('marketing');expect(assignedIntranetSector(['user'])).toBeNull();});
 it('only protected roles grant intranet',()=>{expect(computePermissions({roleNames:['master'],profileRole:null,collaborator:null}).permissions.has('intranet.read')).toBe(true);expect(computePermissions({roleNames:[],profileRole:'comercial',collaborator:null}).permissions.has('intranet.read')).toBe(false);});
 it('validates destinations',()=>{expect(validCampaignDestination('https://example.org/event')).toBe(true);for(const s of ['javascript:alert(1)','http://example.org','https://user:pass@example.org','/agenda'])expect(validCampaignDestination(s)).toBe(false);});
});
