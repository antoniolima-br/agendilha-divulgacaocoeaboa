import { canonicalAdRegions, safeAdDestination, type AdPlacement } from "@/lib/advertising";

export type AdStatus = "pendente" | "publicado" | "recusado";

export interface Ad {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  price_cents: number | null;
  contact_whatsapp: string;
  city: string | null;
  neighborhood: string | null;
  photos: string[];
  status: AdStatus;
  rejection_reason: string | null;
  is_highlight: boolean;
  highlight_plan_id: string | null;
  highlight_until: string | null;
  views_count: number;
  created_at: string;
  ad_type: string;
  event_date: string | null;
  event_location: string | null;
  product_id: string | null;
  destination_url: string | null;
  target_regions: string[];
  placement: AdPlacement | null;
  product_active: boolean;
}

export const AD_CATEGORIES = [
  "Produtos",
  "Serviços",
  "Espaço para eventos",
  "Equipamentos",
  "Alimentos e bebidas",
  "Artesanato",
  "Vagas e freelas",
  "Outros",
] as const;


function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isAdStatus(value: unknown): value is AdStatus {
  return value === "pendente" || value === "publicado" || value === "recusado";
}

/** Normaliza respostas e caches antes de qualquer lista de anúncios ser renderizada. */
export function normalizeAds(rows: unknown): Ad[] {
  if (!Array.isArray(rows)) return [];

  return rows
    .filter(isRecord)
    .filter((row) =>
      typeof row.id === "string" &&
      typeof row.user_id === "string" &&
      typeof row.title === "string" &&
      typeof row.description === "string" &&
      typeof row.category === "string" &&
      typeof row.contact_whatsapp === "string" &&
      isAdStatus(row.status),
    )
    .map((row): Ad => ({
      id: row.id as string,
      user_id: row.user_id as string,
      title: row.title as string,
      description: row.description as string,
      category: row.category as string,
      contact_whatsapp: row.contact_whatsapp as string,
      status: row.status as AdStatus,
      price_cents: typeof row.price_cents === "number" && Number.isFinite(row.price_cents) ? row.price_cents : null,
      city: typeof row.city === "string" ? row.city : null,
      neighborhood: typeof row.neighborhood === "string" ? row.neighborhood : null,
      photos: Array.isArray(row.photos)
        ? row.photos.filter((photo): photo is string => typeof photo === "string" && photo.trim().length > 0)
        : [],
      rejection_reason: typeof row.rejection_reason === "string" ? row.rejection_reason : null,
      is_highlight: row.is_highlight === true,
      highlight_plan_id: typeof row.highlight_plan_id === "string" ? row.highlight_plan_id : null,
      highlight_until: typeof row.highlight_until === "string" ? row.highlight_until : null,
      views_count: typeof row.views_count === "number" && Number.isFinite(row.views_count) ? row.views_count : 0,
      created_at: typeof row.created_at === "string" ? row.created_at : "",
      ad_type: typeof row.ad_type === "string" ? row.ad_type : "gratuito",
      event_date: typeof row.event_date === "string" ? row.event_date : null,
      event_location: typeof row.event_location === "string" ? row.event_location : null,
      product_id: typeof row.product_id === "string" ? row.product_id : null,
      destination_url: safeAdDestination(row.destination_url as string | null),
      target_regions: canonicalAdRegions(row.target_regions),
      placement: isRecord(row.ad_products) && (row.ad_products.placement === "carousel" || row.ad_products.placement === "agenda_card") ? row.ad_products.placement : (row.placement === "carousel" || row.placement === "agenda_card" ? row.placement : null),
      product_active: isRecord(row.ad_products) ? row.ad_products.is_active === true : row.product_active === true,
    }));
}


export interface AdInput {
  title: string;
  description: string;
  category: string;
  price_cents: number | null;
  contact_whatsapp: string;
  city: string | null;
  neighborhood: string | null;
  photos: string[];
  ad_type?: string;
  event_date?: string | null;
  event_location?: string | null;
  product_id?: string | null;
  destination_url?: string | null;
  target_regions?: string[];
}

