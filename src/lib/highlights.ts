export type HighlightStatus = "ativo" | "expirado" | "escondido" | "sem_destaque";

export interface HighlightFields {
  is_highlight?: boolean | null;
  highlight_hidden?: boolean | null;
  highlight_until?: string | null;
  highlight_active?: boolean | null;
  image_url?: string | null;
}

/** Cortesia de lançamento: todo evento publicado com flyer recebe destaque automático. */
export const LAUNCH_FLYER_PROMOTION_ACTIVE = true;

export function hasEventFlyer(event: Pick<HighlightFields, "image_url">): boolean {
  return typeof event.image_url === "string" && event.image_url.trim().length > 0;
}

export function isLaunchPromotionalHighlight(event: HighlightFields): boolean {
  return LAUNCH_FLYER_PROMOTION_ACTIVE && hasEventFlyer(event);
}

/** Status do destaque de um rolê, derivado dos campos de destaque. */
export function highlightStatus(
  event: HighlightFields,
  now: Date = new Date(),
): HighlightStatus {
  if (isLaunchPromotionalHighlight(event)) return "ativo";
  if (!event.is_highlight) return "sem_destaque";
  if (event.highlight_hidden) return "escondido";
  if (event.highlight_until && new Date(event.highlight_until).getTime() <= now.getTime()) {
    return "expirado";
  }
  return "ativo";
}

/** true quando o destaque está valendo agora (respeita prazo e destaque escondido). */
export function isHighlightActive(event: HighlightFields, now: Date = new Date()): boolean {
  if (isLaunchPromotionalHighlight(event)) return true;
  if (typeof event.highlight_active === "boolean") {
    // A view já calcula, mas revalidamos o prazo no cliente para não depender do cache.
    return event.highlight_active && highlightStatus(event, now) === "ativo";
  }
  return highlightStatus(event, now) === "ativo";
}

/** Destaque concedido diretamente pela administração, sem considerar a cortesia automática por flyer. */
export function isManualHighlightActive(event: HighlightFields, now: Date = new Date()): boolean {
  if (!event.is_highlight || event.highlight_hidden) return false;
  if (event.highlight_until && new Date(event.highlight_until).getTime() <= now.getTime()) return false;
  return event.highlight_active !== false;
}

/**
 * Regra promocional exclusiva do banner da Home:
 * - flyers de hoje entram automaticamente;
 * - flyers futuros entram automaticamente apenas quando não há evento hoje;
 * - uma liberação administrativa válida sempre permite o flyer futuro.
 */
export function selectHomeLaunchFlyerEvents<
  T extends HighlightFields & { date?: string | null },
>(
  events: T[],
  todayISO: string,
  hasEventsToday: boolean,
  now: Date = new Date(),
): T[] {
  return events.filter((event) => {
    if (!hasEventFlyer(event)) return false;
    const date = event.date?.trim() ?? "";
    if (date === todayISO) return true;
    if (date <= todayISO) return false;
    return !hasEventsToday || isManualHighlightActive(event, now);
  });
}

/** Dias restantes do destaque (0 quando expirado, null quando sem prazo). */
export function highlightDaysLeft(
  event: HighlightFields,
  now: Date = new Date(),
): number | null {
  if (!event.highlight_until) return null;
  const diff = new Date(event.highlight_until).getTime() - now.getTime();
  if (diff <= 0) return 0;
  return Math.ceil(diff / 86_400_000);
}

/**
 * Ordena colocando os destaques ativos na frente e o restante por data,
 * cortando na quantidade máxima (padrão: 10 do carrossel).
 */
export function pickCarouselEvents<T extends HighlightFields & { date?: string | null }>(
  events: T[],
  limit = 10,
  now: Date = new Date(),
): T[] {
  return [...events]
    .sort((a, b) => {
      const ha = isHighlightActive(a, now) ? 1 : 0;
      const hb = isHighlightActive(b, now) ? 1 : 0;
      if (ha !== hb) return hb - ha;
      return (a.date ?? "").localeCompare(b.date ?? "");
    })
    .slice(0, limit);
}

/** Mantém os destaques ativos no topo do banner principal, preservando variedade dentro de cada grupo. */
export function prioritizeHomeHeroEvents<T extends HighlightFields & { id: string }>(
  events: T[],
  rank: (id: string) => number,
): T[] {
  return [...events].sort((a, b) => {
    const highlightDifference = Number(isHighlightActive(b)) - Number(isHighlightActive(a));
    return highlightDifference || rank(a.id) - rank(b.id);
  });
}

export const HIGHLIGHT_STATUS_LABEL: Record<HighlightStatus, string> = {
  ativo: "Ativo",
  expirado: "Expirado",
  escondido: "Escondido",
  sem_destaque: "Sem destaque",
};
