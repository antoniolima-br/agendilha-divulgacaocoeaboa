import { eventDateISO, saoPauloTodayISO } from "@/lib/eventDate";
import type { SubmissionFormData } from "@/components/submission-form/schema";

export function isArchivedEvent(date: string | null | undefined, now = new Date()): boolean {
  const day = eventDateISO(date);
  return !!day && day < saoPauloTodayISO(now);
}

/** Copy content only: no identity, moderation, payment, consent or schedule state. */
export function repeatEventDraft(row: Record<string, unknown>): Partial<SubmissionFormData> {
  const text = (key: string) => typeof row[key] === "string" ? row[key] as string : "";
  return {
    eventTitle: text("event_title"), description: text("description"), category: text("category"),
    date: "", startTime: "", endTime: "", additionalEvents: [],
    atrativoName: text("atrativo_name"), atrativoType: text("atrativo_type"), atrativoStyle: text("atrativo_style"),
    atrativoContact: text("atrativo_contact"),
    atrativoSourceId: text("atrativo_id") || text("artist_id"),
    atrativoSourceType: text("atrativo_id") ? "atrativo" : text("artist_id") ? "artist" : undefined,
    locationName: text("location"), estabelecimentoId: text("estabelecimento_id"),
    locationType: row.location_type === "public" ? "public" : "commercial",
    addressStreet: text("address_street"), addressNumber: text("address_number"), addressNeighborhood: text("address_neighborhood"),
    addressCity: text("address_city"), addressState: text("address_state"), addressZip: text("address_zip"), locationCep: text("address_zip"),
    videoLink: text("video_link"), contactSocial: text("contact_social"), additionalDetails: text("additional_details"),
    promotionChoice: "free", legalAcceptance: false as unknown as true, duvidasAuthorized: false,
    eventImageUrl: "", eventImageUrlStory: "", eventImageUrlWhatsapp: "", fotos: [],
  };
}