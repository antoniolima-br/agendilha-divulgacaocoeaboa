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
/** Data/hora legível em PT-BR: "Sáb., 26 de set. às 18:00". */
export function formatEventDateTimeBR(date?: string | null, time?: string | null): string {
  const iso = eventDateISO(date);
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00Z`);
  const wd = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" }).format(d).replace(".", "");
  const mo = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" }).format(d).replace(".", "");
  const label = `${wd.charAt(0).toUpperCase()}${wd.slice(1)}., ${iso.slice(8, 10)} de ${mo.charAt(0).toUpperCase()}${mo.slice(1)}.`;
  const t = time?.match(/(\d{2}):(\d{2})/);
  return t ? `${label} às ${t[1]}:${t[2]}` : label;
}
