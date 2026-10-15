export const visionFlyerSchema = {
  type: "object", additionalProperties: false,
  properties: Object.fromEntries(["titulo", "atrativo", "data", "horario", "local"].map(key => [key, { type: ["string", "null"] }])),
  required: ["titulo", "atrativo", "data", "horario", "local"],
};

export type VisionFlyerFields = Partial<Record<"eventTitle" | "atrativoName" | "date" | "startTime" | "locationName", string>>;

export function mapVisionFlyer(input: unknown): VisionFlyerFields {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Não consegui ler esse flyer. Preencha os dados manualmente.");
  const source = input as Record<string, unknown>;
  const result: VisionFlyerFields = {};
  const keys = { titulo: "eventTitle", atrativo: "atrativoName", data: "date", horario: "startTime", local: "locationName" } as const;
  for (const [key, field] of Object.entries(keys)) {
    const raw = source[key];
    if (typeof raw !== "string" || !raw.trim()) continue;
    let value = raw.trim();
    if (field === "date") {
      value = value.replace(/^(\d{2})\/(\d{2})\/(\d{4})$/, "$3-$2-$1");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) continue;
      const date = new Date(`${value}T12:00:00Z`);
      if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) continue;
    }
    if (field === "startTime" && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) continue;
    result[field] = value.slice(0, field === "locationName" ? 200 : 120);
  }
  return result;
}

export function safeVisionPatch(extracted: VisionFlyerFields, before: Record<string, unknown>, current: Record<string, unknown>, protectedFields: ReadonlySet<string> = new Set()): VisionFlyerFields {
  const patch: VisionFlyerFields = {};
  for (const key of Object.keys(extracted) as (keyof VisionFlyerFields)[]) {
    if (protectedFields.has(key) || current[key] !== before[key] || (current[key] && key !== "date")) continue;
    if (key === "locationName" && current.estabelecimentoId) continue;
    if (key === "atrativoName" && current.atrativoSourceId) continue;
    patch[key] = extracted[key];
  }
  return patch;
}