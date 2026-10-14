export type EngagementOrigin = "direct" | "whatsapp" | "social" | "radar" | "campaign";

export type EngagementDailyPoint = {
  name: string;
  flyer_opens: number;
  campaign_opens: number;
  leads: number;
  interactions: number;
  investment_cents: number;
};

export type EngagementSource = {
  source: EngagementOrigin;
  opens: number;
  leads: number;
  conversions: number;
  conversion_rate: number | null;
};

export type EngagementFunnelReport = {
  summary: {
    flyer_opens: number;
    campaign_opens: number;
    leads: number;
    interactions: number;
    favorites: number;
    qualified_leads: number;
    investment_cents: number;
    interaction_rate: number | null;
    presence_collected: boolean;
  };
  daily: EngagementDailyPoint[];
  sources: EngagementSource[];
};

export const ENGAGEMENT_ORIGIN_LABELS: Record<EngagementOrigin, string> = {
  direct: "Acesso direto",
  whatsapp: "WhatsApp",
  social: "Redes sociais",
  radar: "Meu Radar",
  campaign: "Campanhas",
};

export function normalizeEngagementOrigin(value: string | null): EngagementOrigin {
  return value && value in ENGAGEMENT_ORIGIN_LABELS ? value as EngagementOrigin : "direct";
}

export function engagementRange(days: number, now = new Date()) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(now);
  const start = new Date(`${today}T12:00:00Z`);
  start.setUTCDate(start.getUTCDate() - Math.max(1, days) + 1);
  return {
    startAt: `${start.toISOString().slice(0, 10)}T00:00:00-03:00`,
    endAt: nextDay(today),
  };
}

function nextDay(date: string) {
  const end = new Date(`${date}T12:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 1);
  return `${end.toISOString().slice(0, 10)}T00:00:00-03:00`;
}