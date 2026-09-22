const SAO_PAULO_TIME_ZONE = "America/Sao_Paulo";

export const PUBLIC_EVENT_STATUSES = ["aprovado", "publicado", "divulgado"] as const;

function isCalendarDate(year: number, month: number, day: number): boolean {
  const candidate = new Date(Date.UTC(year, month - 1, day, 12));
  return candidate.getUTCFullYear() === year
    && candidate.getUTCMonth() === month - 1
    && candidate.getUTCDate() === day;
}

export function saoPauloTodayISO(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SAO_PAULO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function eventDateISO(value?: string | null): string {
  const normalized = value?.trim();
  if (!normalized) return "";

  const isoDate = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDate) {
    const [, year, month, day] = isoDate;
    return isCalendarDate(Number(year), Number(month), Number(day)) ? normalized : "";
  }

  const brazilianDate = normalized.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brazilianDate) {
    const [, day, month, year] = brazilianDate;
    if (!isCalendarDate(Number(year), Number(month), Number(day))) return "";
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return "";
  return saoPauloTodayISO(parsed);
}

export function isValidEventDate(value?: string | null): boolean {
  return eventDateISO(value) !== "";
}

export function addDaysToISO(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day + days, 12));
  return utcDate.toISOString().slice(0, 10);
}

export function isPublicEventStatus(status?: string | null): boolean {
  return PUBLIC_EVENT_STATUSES.includes(status as (typeof PUBLIC_EVENT_STATUSES)[number]);
}