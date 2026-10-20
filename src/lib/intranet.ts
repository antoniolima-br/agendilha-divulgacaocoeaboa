export const INTRANET_SECTORS = ["comercial", "marketing", "administracao", "financeiro", "desenvolvimento"] as const;
export type IntranetSector = typeof INTRANET_SECTORS[number];
export const SECTOR_SHORTCUTS: IntranetSector[] = ["comercial", "marketing", "administracao", "financeiro"];
export const ADMINISTRATIVE_ROLES = ["master", "senior", "admin", ...INTRANET_SECTORS] as const;
/** Partners on the administrative team: directors plus sector holders. All read every sector. */
export const INTRANET_DIRECTOR_ROLES = ["master", "senior"] as const;
export const INTRANET_PARTNER_ROLES = [...INTRANET_DIRECTOR_ROLES, ...INTRANET_SECTORS] as const;
export function isIntranetDirector(roles: string[]): boolean { return roles.some((r) => (INTRANET_DIRECTOR_ROLES as readonly string[]).includes(r)); }
export function isIntranetPartner(roles: string[]): boolean { return roles.some((r) => (INTRANET_PARTNER_ROLES as readonly string[]).includes(r)); }
export function canViewIntranetOverview(roles: string[]): boolean {
  return isIntranetPartner(roles);
}
export const sectorLabels: Record<IntranetSector, string> = { comercial: "Comercial", marketing: "Marketing", administracao: "Curadoria", financeiro: "Financeiro", desenvolvimento: "Desenvolvimento" };
export const sectorOwners: Record<IntranetSector, string> = { comercial: "Mauro Iorio", marketing: "Prof. Ana", administracao: "Cintya Coelho", financeiro: "Bia Pinha", desenvolvimento: "Equipe técnica" };
export function intranetSectors(roles: string[]): IntranetSector[] {
  return isIntranetPartner(roles) ? [...INTRANET_SECTORS] : [];
}
export function assignedIntranetSector(roles: string[]): IntranetSector | null {
  return INTRANET_SECTORS.find((sector) => roles.includes(sector)) ?? (roles.includes("admin") ? "administracao" : null);
}
export function isAdministrativeMember(roles: string[]): boolean {
  return roles.some((role) => ADMINISTRATIVE_ROLES.some((administrativeRole) => administrativeRole === role));
}
export function isIntranetSector(value: string | undefined): value is IntranetSector { return INTRANET_SECTORS.some((sector) => sector === value); }
export function campaignLink(id: string) { return `${window.location.origin}/campanha/${id}`; }
export function validCampaignDestination(value: string): boolean { try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; } }
export type ChartPoint = { name: string; value: number };
export type Operation = { id: string; sector: 'administracao' | 'desenvolvimento'; title: string; status: string; priority: string; responsible: string; due_on: string | null; notes: string; created_at: string; updated_at: string };
export type IntranetBI = {
  summary: { received_cents: number; expenses_cents: number; balance_cents: number; submissions: number; users: number; campaign_opens: number; won_leads: number; open_operations: number };
  cashflow: { name: string; revenue: number; expenses: number }[];
  sources: ChartPoint[]; funnel: ChartPoint[]; traffic: ChartPoint[]; campaigns: ChartPoint[]; operations: ChartPoint[];
  administration: IntranetDashboard; marketing: IntranetDashboard; commercial: IntranetDashboard;
};
export type IntranetDashboard = {
  summary: { submissions: number; pending: number; users: number; received_cents: number };
  consolidated: ChartPoint[]; growth?: ChartPoint[]; inventory?: ChartPoint[];
  moderation_hours?: number | null; ranking?: ChartPoint[];
  queue?: { id: string; event_title: string | null; date: string; start_time: string | null; location: string | null; promotion_choice: string }[];
  ads?: { title: string; status: string; product: string | null; highlight_until: string | null; target_regions: string[] }[];
};
export type SectorAccess = { can_view: boolean; editors: Record<IntranetSector, boolean> };/** Public URL slug per sector: Curadoria is stored as "administracao" but lives at /intranet/curadoria. */
export const INTRANET_BI_SLUG = "bi";
export function sectorSlug(sector: IntranetSector): string { return sector === "administracao" ? "curadoria" : sector; }
export function sectorFromSlug(slug: string | undefined): IntranetSector | undefined {
  if (slug === "curadoria") return "administracao";
  return isIntranetSector(slug) ? slug : undefined;
}
export function isOverviewSlug(slug: string | undefined): boolean { return !slug || slug === INTRANET_BI_SLUG || slug === "visao-geral"; }
