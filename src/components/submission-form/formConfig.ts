import { saoPauloTodayISO } from "@/lib/eventDate";
import type { SubmissionFormData } from "./schema";

export const SUBMISSION_DRAFT_KEY = "agendilha_event_submission_draft";

export const SUBMISSION_STEPS = [
  { id: 1, title: "Informações do evento" },
  { id: 2, title: "Termos e contato" },
  { id: 3, title: "Revisão" },
] as const;

export const SUBMISSION_FIELD_LABELS: Record<string, string> = {
  nickName: "Seu nome",
  basicPhone: "WhatsApp para contato",
  companyName: "Nome completo / Empresa",
  email: "E-mail",
  date: "Data do evento",
  startTime: "Horário de início",
  ageRating: "Classificação",
  eventTitle: "Nome do evento",
  endTime: "Horário previsto para término",
  atrativoName: "Nome do atrativo",
  atrativoContact: "WhatsApp do atrativo",
  atrativoEmail: "E-mail do atrativo",
  atrativoCategory: "Categoria do atrativo",
  locationName: "Nome do local/estabelecimento",
  eventAddress: "Endereço resumido do local",
  locationType: "Categoria do espaço",
  locationContact: "Contato do local/estabelecimento",
  locationCep: "CEP do local",
  localTipo: "Tipo de local",
  addressNeighborhood: "Bairro do local",
  legalAcceptance: "Aceite dos termos",
  duvidasWhatsapp: "WhatsApp do responsável pelas informações",
  duvidasAuthorized: "Autorização de uso do WhatsApp",
};

export const SUBMISSION_ERROR_STEPS: Record<string, number> = {
  date: 1, startTime: 1, endTime: 1, eventTitle: 1, description: 1,
  atrativoSourceId: 1, atrativoName: 1, atrativoType: 1, atrativoStyle: 1,
  atrativoDescription: 1, atrativoContact: 1, atrativoEmail: 1,
  locationName: 1, eventAddress: 1, locationCep: 1, addressNeighborhood: 1,
  category: 1, ageRating: 1, atrativoCategory: 1, localTipo: 1,
  locationType: 1, locationContact: 1, duvidasWhatsapp: 1,
  nickName: 2, basicPhone: 2, companyName: 2, email: 2,
  addressZip: 2, addressStreet: 2, addressNumber: 2,
  legalAcceptance: 2, responsavelNome: 2, duvidasAuthorized: 2,
  additionalEvents: 1,
};

export function fieldsForSubmissionStep(step: number): Array<keyof SubmissionFormData> {
  if (step === 1) return ["date", "startTime", "atrativoName", "additionalEvents"];
  if (step === 2) return ["legalAcceptance"];
  return [];
}

export function cleanOptional(value?: string | null): string | null {
  const clean = value == null ? "" : String(value).trim();
  return !clean || /^não informado$/i.test(clean) ? null : clean;
}

export function resolveAtrativoCategory(values: Pick<SubmissionFormData, "atrativoCategory" | "atrativoCategoryOther">): string | null {
  const category = (values.atrativoCategory ?? "").trim();
  if (category === "Outros") return (values.atrativoCategoryOther ?? "").trim() || "Outros";
  return category || null;
}

export function toEventDateOnly(value?: string | null): string | null {
  const date = (value ?? "").trim();
  if (!date || /^\d{4}-\d{2}-\d{2}$/.test(date)) return date || null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(parsed);
}
/** Only suggest a day for new/undated drafts; never replace the organizer’s choice. */
export function suggestedSubmissionDate(value?: string | null, now = new Date()): string {
  return value?.trim() || saoPauloTodayISO(now);
}
