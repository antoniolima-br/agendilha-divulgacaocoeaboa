import { normalizeText } from "./utils";

export { normalizeText };

export const getEventFallbackImage = (category: string | null) => {
  const fallbacks: Record<string, string> = {
    "musica": "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800",
    "gastronomia": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800",
    "teatro": "https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&q=80&w=800",
    "esporte": "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=800",
    "outros": "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800",
  };

  if (!category) return fallbacks.outros;
  
  const normalized = normalizeText(category);
  
  if (normalized.includes("musica") || normalized.includes("show")) return fallbacks.musica;
  if (normalized.includes("gastronomia") || normalized.includes("comida") || normalized.includes("restaurante")) return fallbacks.gastronomia;
  if (normalized.includes("teatro") || normalized.includes("arte") || normalized.includes("cultura") || normalized.includes("cinema")) return fallbacks.teatro;
  if (normalized.includes("esporte")) return fallbacks.esporte;
  
  return fallbacks.outros;
};

export function getFallbackImage(category: string) {
  return getEventFallbackImage(category);
}

const EVENT_FALLBACK_PALETTES = [
  "bg-primary text-primary-foreground",
  "bg-secondary text-secondary-foreground",
  "bg-foreground text-background",
  "bg-destructive text-destructive-foreground",
  "bg-accent text-accent-foreground",
] as const;

/** Escolhe uma paleta estável para o mesmo evento, sem depender da ordem da lista. */
export function getEventFallbackPalette(seed: string): string {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return EVENT_FALLBACK_PALETTES[hash % EVENT_FALLBACK_PALETTES.length];
}

export interface AddressComponents {
  location?: string | null;
  address_street?: string | null;
  address_number?: string | null;
  address_neighborhood?: string | null;
  address_city?: string | null;
}

export function formatEventAddress(ev: AddressComponents): string {
  const streetPart = [ev.address_street, ev.address_number].filter(Boolean).join(", ");
  const parts = [
    ev.location,
    streetPart,
    ev.address_neighborhood,
    ev.address_city
  ].filter(Boolean);
  return parts.join(" — ");
}

export interface ShareableEvent extends AddressComponents {
  event_title: string | null;
  date?: string | null;
  start_time?: string | null;
  description?: string | null;
  slug?: string | null;
  id: string;
}

export function buildEventShareText(ev: ShareableEvent, options: { includeBrief?: boolean; url?: string } = {}): string {
  const title = ev.event_title || "Evento";
  const time = ev.start_time ? ev.start_time.slice(0, 5) : "";
  const addr = formatEventAddress(ev);
  const brief = options.includeBrief && ev.description 
    ? (ev.description.length > 280 ? `\n${ev.description.slice(0, 277).trimEnd()}…` : `\n${ev.description}`)
    : "";
  
  const lines = [
    `*$\{title}*`,
    ev.date ? `📅 $\{ev.date}${time ? ` · $\{time}` : ""}` : "",
    addr ? `📍 $\{addr}` : "",
    brief,
    options.url ? `\nMais informações: $\{options.url}` : ""
  ].filter(Boolean);
  
  return lines.join("\n");
}
