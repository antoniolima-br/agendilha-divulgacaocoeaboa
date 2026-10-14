export type FlyerEngagementPeriod = "today" | "7days" | "month" | "custom";

export type FlyerTrendPoint = { bucket: string; value: number };
export type FlyerEngagementItem = {
  id: string; title: string; published_at: string; event_date: string | null;
  lifecycle: "active" | "past"; total: number; trend: FlyerTrendPoint[];
};
export type FlyerEngagementReport = {
  summary: { total: number; daily_average: number; champion: { id: string; title: string; total: number } | null };
  items: FlyerEngagementItem[];
  granularity: "hour" | "day";
};

const SP_TIME_ZONE = "America/Sao_Paulo";

function saoPauloDateParts(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: SP_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const read = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return { year: read("year"), month: read("month"), day: read("day") };
}

function nextDate(date: string) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
}

export function flyerEngagementRange(period: FlyerEngagementPeriod, now = new Date(), customStart = "", customEnd = "") {
  const { year, month, day } = saoPauloDateParts(now);
  const today = `${year}-${month}-${day}`;
  let start = today;
  let end = today;
  if (period === "7days") {
    const first = new Date(`${today}T12:00:00Z`);
    first.setUTCDate(first.getUTCDate() - 6);
    start = first.toISOString().slice(0, 10);
  } else if (period === "month") start = `${year}-${month}-01`;
  else if (period === "custom" && customStart && customEnd) { start = customStart; end = customEnd; }
  return { startAt: `${start}T00:00:00-03:00`, endAt: `${nextDate(end)}T00:00:00-03:00` };
}

export function formatFlyerBucket(bucket: string, granularity: "hour" | "day") {
  const value = new Date(`${bucket}${bucket.includes("T") ? "-03:00" : "T12:00:00-03:00"}`);
  return new Intl.DateTimeFormat("pt-BR", granularity === "hour" ? { timeZone: SP_TIME_ZONE, hour: "2-digit", minute: "2-digit" } : { timeZone: SP_TIME_ZONE, day: "2-digit", month: "2-digit" }).format(value);
}