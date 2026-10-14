export type CurationImpactChannel = "qr_code" | "link" | "whatsapp" | "share" | "other";

export type CurationImpactEvent = {
  id: string;
  title: string;
  event_date: string | null;
  start_time: string | null;
  image_url: string | null;
  status: string;
  lifetime_views: number;
  opens: number;
  favorites: number;
  leads: number;
  conversions: number;
  channels: Record<CurationImpactChannel, number>;
};

export type CurationImpactActivity = {
  event_id: string;
  occurred_at: string;
  kind: "open" | "favorite" | "lead" | "conversion";
  source: string;
  person: string;
  detail: string | null;
};

export type CurationImpactReport = {
  summary: { opens: number; favorites: number; leads: number; conversions: number };
  events: CurationImpactEvent[];
  activity: CurationImpactActivity[];
};

export const CURATION_CHANNEL_LABELS: Record<CurationImpactChannel, string> = {
  qr_code: "QR Code",
  link: "Link copiado",
  whatsapp: "WhatsApp",
  share: "Compartilhamento",
  other: "Outros acessos",
};

export const CURATION_ACTIVITY_LABELS: Record<CurationImpactActivity["kind"], string> = {
  open: "Abriu o rolê",
  favorite: "Favoritou",
  lead: "Virou lead",
  conversion: "Converteu",
};

export function normalizeCurationChannel(value: string | null) {
  const allowed = ["curation_link", "curation_qr", "curation_whatsapp", "curation_share"];
  return value && allowed.includes(value) ? value : undefined;
}

export function curationImpactRange(days: number, now = new Date()) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(now);
  const start = new Date(`${today}T12:00:00Z`);
  start.setUTCDate(start.getUTCDate() - Math.max(1, days) + 1);
  const end = new Date(`${today}T12:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 1);
  return {
    startAt: `${start.toISOString().slice(0, 10)}T00:00:00-03:00`,
    endAt: `${end.toISOString().slice(0, 10)}T00:00:00-03:00`,
  };
}

export function formatCurationActivityDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}