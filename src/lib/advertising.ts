import { normalizeGeography, REGIONS, type Region } from "@/lib/regions";

export type AdPlacement = "carousel" | "agenda_card";
export function safeAdDestination(value: string | null | undefined): string | null {
  if (!value?.trim() || /\s/.test(value.trim())) return null;
  try {
    const url = new URL(value.trim());
    if (!["https:", "http:"].includes(url.protocol) || !url.hostname || url.username || url.password) return null;
    return url.href;
  } catch { return null; }
}
export function canonicalAdRegions(value: unknown): Region[] {
  if (!Array.isArray(value)) return [];
  return REGIONS.filter((region) => value.some((item) => typeof item === "string" && normalizeGeography(item) === normalizeGeography(region)));
}
export function matchesAdAudience(ad: { product_id: string | null; target_regions: readonly string[]; product_active?: boolean; placement?: AdPlacement | null }, region: string, placement?: AdPlacement): boolean {
  if (!ad.product_id) return placement !== "agenda_card";
  if (!ad.product_active || (placement && ad.placement !== placement)) return false;
  const audience = REGIONS.find((item) => normalizeGeography(item) === normalizeGeography(region));
  return Boolean(audience && ad.target_regions.includes(audience));
}