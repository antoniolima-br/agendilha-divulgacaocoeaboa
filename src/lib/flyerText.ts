import { sanitizeFlyerFields, type FlyerFields } from "../../supabase/functions/_shared/flyerFields";
const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const weekdays = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
/** Conservative suggestions; ambiguous schedules stay manual. */
export function parseFlyerText(text: string, now = new Date()): FlyerFields {
  const lines = text.split(/\r?\n/).map(line => line.trim().replace(/\s+/g, " ")).filter(Boolean);
  const fields: FlyerFields = {};
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const year = Number(today.slice(0, 4));
  const dates = [...text.matchAll(/\b(\d{1,2})\s*[\/.\-]\s*(\d{1,2})(?:\s*[\/.\-]\s*(\d{4}|\d{2}))?\b/g)];
  const candidates = new Set<string>();
  for (const match of dates) {
    const explicitYear = match[3] ? Number(match[3].length === 2 ? `20${match[3]}` : match[3]) : year;
    let value = `${explicitYear}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
    if (!sanitizeFlyerFields({ date: value }).date) continue;
    if (!match[3] && value < today) value = `${year + 1}${value.slice(4)}`;
    if (sanitizeFlyerFields({ date: value }).date) candidates.add(value);
  }
  if (candidates.size === 1) fields.date = [...candidates][0];
  if (!dates.length) {
    const days = new Set([...normalize(text).matchAll(/\b(domingo|segunda|terca|quarta|quinta|sexta|sabado)(?:-feira)?\b/g)].map(match => weekdays.indexOf(match[1])));
    if (days.size === 1) {
      const day = [...days][0];
      const date = new Date(`${today}T12:00:00Z`);
      date.setUTCDate(date.getUTCDate() + (day - date.getUTCDay() + 7) % 7);
      fields.date = date.toISOString().slice(0, 10);
    }
  }
  const times = [...new Set([...text.matchAll(/\b([01]?\d|2[0-3])\s*(?:[hH]\s*([0-5]\d)?|:\s*([0-5]\d))\b/g)].map(match => `${match[1].padStart(2, "0")}:${match[2] || match[3] || "00"}`))];
  if (times.length === 1) fields.startTime = times[0];
  const venue = lines.find(line => /^(?:local|onde)\s*[:\-]/i.test(line)) ?? lines.find(line => /^(?:bar|restaurante|espaco|espaço|casa|clube|arena|teatro|centro cultural)\s+\S/i.test(line));
  if (venue) fields.locationName = venue.replace(/^(?:local|onde)\s*[:\-]\s*/i, "");
  const title = lines.find(line => /^(?:evento|titulo|título)\s*[:\-]/i.test(line)) ?? lines.find(line => line !== venue && /[a-zÀ-ÿ]/i.test(line) && line.length >= 4 && !/\d{1,2}\s*[\/.:\-]\s*\d{1,2}|\b\d{1,2}\s*h\b/i.test(line) && !/^(?:domingo|segunda|terca|quarta|quinta|sexta|sabado|rua|av\b|avenida|entrada|ingresso|informacoes|realizacao|apoio|patrocinio)/.test(normalize(line)));
  if (title) fields.eventTitle = title.replace(/^(?:evento|titulo|título)\s*[:\-]\s*/i, "");
  return sanitizeFlyerFields(fields);
}
