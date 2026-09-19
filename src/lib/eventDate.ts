const SAO_PAULO_TIME_ZONE = "America/Sao_Paulo";

export const PUBLIC_EVENT_STATUSES = ["aprovado", "publicado", "divulgado"] as const;

export function saoPauloTodayISO(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SAO_PAULO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function eventDateISO(value?: string | null): string {
  if (!value) return "";
  if (!value.includes("T")) return value.slice(0, 10);

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10);
  return saoPauloTodayISO(parsed);
}

export function addDaysToISO(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day + days, 12));
  return utcDate.toISOString().slice(0, 10);
}

export function isPublicEventStatus(status?: string | null): boolean {
  return PUBLIC_EVENT_STATUSES.includes(status as (typeof PUBLIC_EVENT_STATUSES)[number]);
}