/** Faixas de horário que a pessoa pode escolher pro Meu Radar. */
export const TIME_PREFERENCES = [
  { id: "manha", label: "Manhã", hint: "6h às 12h", from: 6, to: 12 },
  { id: "tarde", label: "Tarde", hint: "12h às 18h", from: 12, to: 18 },
  { id: "noite", label: "Noite", hint: "18h à meia-noite", from: 18, to: 24 },
  { id: "madrugada", label: "Madrugada", hint: "meia-noite às 6h", from: 0, to: 6 },
] as const;

export type TimePreference = (typeof TIME_PREFERENCES)[number]["id"];

const IDS = new Set<string>(TIME_PREFERENCES.map((t) => t.id));

export function cleanTimePreferences(value: unknown): TimePreference[] {
  return Array.isArray(value) ? [...new Set(value.filter((v): v is TimePreference => typeof v === "string" && IDS.has(v)))] : [];
}

/** Faixa do horário de início ("HH:MM"); sem horário válido, devolve null. */
export function timePeriodOf(startTime: string | null | undefined): TimePreference | null {
  const match = /^(\d{1,2}):?(\d{2})?/.exec(String(startTime ?? "").trim());
  if (!match) return null;
  const hour = Number(match[1]);
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return null;
  return TIME_PREFERENCES.find((t) => hour >= t.from && hour < t.to)?.id ?? null;
}

/** Sem faixa escolhida, vale qualquer hora. Rolê sem horário informado continua aparecendo. */
export function matchesTimePreferences(startTime: string | null | undefined, prefs: unknown): boolean {
  const chosen = cleanTimePreferences(prefs);
  if (!chosen.length) return true;
  const period = timePeriodOf(startTime);
  return period === null || chosen.includes(period);
}
