export const INTRANET_SECTORS = ["comercial", "marketing", "administracao", "financeiro", "desenvolvimento"] as const;
export type IntranetSector = typeof INTRANET_SECTORS[number];
export const sectorLabels: Record<IntranetSector, string> = { comercial: "Comercial", marketing: "Marketing", administracao: "Administração", financeiro: "Financeiro", desenvolvimento: "Desenvolvimento" };
export function intranetSectors(roles: string[]): IntranetSector[] {
  if (roles.some((role) => ["master", "senior"].includes(role))) return [...INTRANET_SECTORS];
  const assigned = INTRANET_SECTORS.filter((sector) => roles.includes(sector));
  return assigned.length ? assigned : roles.includes("admin") ? ["administracao"] : [];
}
export function isIntranetSector(value: string | undefined): value is IntranetSector { return INTRANET_SECTORS.some((sector) => sector === value); }
export function campaignLink(id: string) { return `${window.location.origin}/campanha/${id}`; }
export function validCampaignDestination(value: string): boolean { try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; } }
export type ChartPoint = { name: string; value: number };
export type IntranetDashboard = {
  summary: { submissions: number; pending: number; users: number; received_cents: number };
  consolidated: ChartPoint[]; growth?: ChartPoint[]; inventory?: ChartPoint[];
  moderation_hours?: number | null; ranking?: ChartPoint[];
  queue?: { id: string; event_title: string | null; date: string; start_time: string | null; location: string | null; promotion_choice: string }[];
  ads?: { title: string; status: string; product: string | null; highlight_until: string | null; target_regions: string[] }[];
};