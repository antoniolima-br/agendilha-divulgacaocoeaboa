export type GuestOrigin = "curation" | "whatsapp" | "social" | "campaign" | "direct";
export type GuestStatus = "invited" | "opened" | "converted" | "declined";

export type GuestAnalyticsRow = {
  id: string;
  event_id: string;
  event_title: string;
  name: string;
  whatsapp: string | null;
  origin: GuestOrigin;
  status: GuestStatus;
  invited_at: string;
  converted_at: string | null;
  opens: number;
  first_opened_at: string | null;
  last_opened_at: string | null;
};

export type GuestAnalyticsReport = {
  summary: {
    guests: number;
    opened: number;
    converted: number;
    open_rate: number | null;
    conversion_rate: number | null;
  };
  guests: GuestAnalyticsRow[];
};

export const GUEST_ORIGIN_LABELS: Record<GuestOrigin, string> = {
  curation: "Curadoria",
  whatsapp: "WhatsApp",
  social: "Redes sociais",
  campaign: "Campanha",
  direct: "Cadastro direto",
};

export const GUEST_STATUS_LABELS: Record<GuestStatus, string> = {
  invited: "Convidado",
  opened: "Abriu o convite",
  converted: "Convertido",
  declined: "Não participará",
};

export function guestInviteLink(eventSlug: string | null, eventId: string, token: string, origin: string) {
  const identifier = eventSlug || eventId;
  const params = new URLSearchParams({ src: origin === "social" ? "social" : origin === "campaign" ? "campaign" : origin === "whatsapp" ? "whatsapp" : "direct", channel: "curation_link", guest: token });
  return `${window.location.origin}/evento/${encodeURIComponent(identifier)}?${params.toString()}`;
}

export function formatGuestDateTime(value: string | null) {
  if (!value) return "Ainda não abriu";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
