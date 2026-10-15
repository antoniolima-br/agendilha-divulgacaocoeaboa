import { sanitizeFlyerFields, type FlyerFields } from "../../supabase/functions/_shared/flyerFields";
const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const weekdays = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
const months = ["janeiro", "fevereiro", "marco", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const monthPattern = months.join("|");
const weekdayPattern = weekdays.join("|");
/** Conservative suggestions; ambiguous schedules stay manual. */
export function parseFlyerText(text: string, now = new Date()): FlyerFields {
  const lines = text.split(/\r?\n/).map(line => line.trim().replace(/\s+/g, " ")).filter(Boolean);
  const fields: FlyerFields = {};
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const year = Number(today.slice(0, 4));
  const normalized = normalize(text);
  const dates = [...normalized.matchAll(/\b(\d{1,2})\s*[\/.\-]\s*(\d{1,2})(?:\s*[\/.\-]\s*(\d{4}|\d{2}))?\b/g)];
  const writtenDates = [...normalized.matchAll(new RegExp(`\\b(\\d{1,2})\\s*(?:de\\s+)?(${monthPattern})(?:\\s+(?:de\\s+)?(\\d{4}))?\\b`, "g"))];
  const allDates = [...dates.map(match => [match[1], match[2], match[3]]), ...writtenDates.map(match => [match[1], String(months.indexOf(match[2]) + 1), match[3]])];
  const candidates = new Set<string>();
  for (const [day, month, suppliedYear] of allDates) {
    const explicitYear = suppliedYear ? Number(suppliedYear.length === 2 ? `20${suppliedYear}` : suppliedYear) : year;
    let value = `${explicitYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    if (!sanitizeFlyerFields({ date: value }).date) continue;
    if (!suppliedYear && value < today) value = `${year + 1}${value.slice(4)}`;
    if (sanitizeFlyerFields({ date: value }).date) candidates.add(value);
  }
  if (candidates.size === 1) fields.date = [...candidates][0];
  if (!allDates.length && !new RegExp(`\\b(?:${monthPattern})\\b`).test(normalized)) {
    const days = new Set([...normalize(text).matchAll(/\b(domingo|segunda|terca|quarta|quinta|sexta|sabado)(?:-feira)?\b/g)].map(match => weekdays.indexOf(match[1])));
    if (days.size === 1) {
      const day = [...days][0];
      const date = new Date(`${today}T12:00:00Z`);
      date.setUTCDate(date.getUTCDate() + (day - date.getUTCDay() + 7) % 7);
      fields.date = date.toISOString().slice(0, 10);
    }
  }
  const timePattern = /\b(\d{1,2})\s*(?:h\s*(\d{2})?|:\s*(\d{2}))\b/g;
  const times = [...new Set([...normalized.matchAll(timePattern)].map(match => `${match[1].padStart(2, "0")}:${match[2] || match[3] || "00"}`).filter(value => sanitizeFlyerFields({ startTime: value }).startTime))];
  // Bare numbers need an explicit time keyword; never interpret prices or days as hours.
  for (const match of normalized.matchAll(/\b(?:as|horario\s*[:\-]?|inicio\s*[:\-]?)\s+(\d{1,2})(?!\d|\s*[h:\/.\-])\b/g)) {
    const value = `${match[1].padStart(2, "0")}:00`;
    if (sanitizeFlyerFields({ startTime: value }).startTime && !times.includes(value)) times.push(value);
  }
  if (times.length === 1) fields.startTime = times[0];
  const venueLabel = /^(?:local do evento|local|onde)\s*[:\-–]?\s+/i;
  const venue = lines.find(line => venueLabel.test(line)) ?? lines.find(line => /^(?:bar|restaurante|espaco|espaço|casa|clube|arena|teatro|centro cultural)\s+\S/i.test(line));
  if (venue) fields.locationName = venue.replace(venueLabel, "");
  const title = lines.find(line => /^(?:evento|titulo|título)\s*[:\-]/i.test(line)) ?? lines.find(line => {
    const lower = normalize(line);
    return line !== venue && /[a-zÀ-ÿ]/i.test(line) && line.length >= 4
      && !/\d{1,2}\s*[\/.:\-]\s*\d{1,2}|\b\d{1,2}\s*h\b/i.test(line)
      && !new RegExp(`\\b(?:${monthPattern})\\b|^(?:${weekdayPattern}|as\\b|horario\\b|inicio\\b|a partir\\b|dia\\b|rua\\b|av\\b|avenida\\b|entrada\\b|ingresso\\b|informacoes\\b|realizacao\\b|apoio\\b|patrocinio\\b|apresenta\\b)`).test(lower);
  });
  if (title) fields.eventTitle = title.replace(/^(?:evento|titulo|título)\s*[:\-]\s*/i, "");
  return sanitizeFlyerFields(fields);
}
