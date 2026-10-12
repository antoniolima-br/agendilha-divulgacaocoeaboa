export const flyerFieldLimits = {
  eventTitle: 120, date: 10, startTime: 5, endTime: 5,
  locationName: 200, eventAddress: 300, addressStreet: 200,
  addressNumber: 20, addressNeighborhood: 120, addressCity: 120,
  addressState: 2, description: 500,
} as const;
export type FlyerField = keyof typeof flyerFieldLimits;
export type FlyerFields = Partial<Record<FlyerField, string>>;

export const flyerOutputSchema = {
  type: "object", additionalProperties: false,
  properties: Object.fromEntries(Object.keys(flyerFieldLimits).map(key => [key, { type: ["string", "null"] }])),
  required: Object.keys(flyerFieldLimits),
};

/** Treat model output as untrusted: content only, no consent, status, IDs or money. */
export function sanitizeFlyerFields(input: unknown): FlyerFields {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Não deu pra ler os dados do flyer. Preencha manualmente ou envie outra imagem.");
  const result: FlyerFields = {};
  for (const key of Object.keys(flyerFieldLimits) as FlyerField[]) {
    const raw = (input as Record<string, unknown>)[key];
    if (typeof raw !== "string" || !raw.trim()) continue;
    const value = raw.trim().slice(0, flyerFieldLimits[key]);
    if (key === "date") {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) continue;
      const date = new Date(`${value}T12:00:00Z`);
      if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) continue;
    }
    if ((key === "startTime" || key === "endTime") && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) continue;
    if (key === "addressState" && !/^[A-Z]{2}$/.test(value)) continue;
    result[key] = value;
  }
  return result;
}