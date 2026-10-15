export const ORGANIZER_EDITABLE_STATUSES = ["rascunho", "draft", "pendente", "pending", "em_revisao", "recebido", "rejeitado", "rejected"] as const;
export function canEditOwnEvent(event: { status?: string | null; approved_at?: string | null; published_at?: string | null; deleted_at?: string | null }) {
  return !event.deleted_at && !event.approved_at && !event.published_at && ORGANIZER_EDITABLE_STATUSES.some((status) => status === event.status);
}
export function organizerStatus(status: string, approvedAt?: string | null) {
  if (["suspenso", "suspended", "cancelado", "blocked"].includes(status) || (approvedAt && ["pendente", "rejeitado"].includes(status))) return "Suspenso";
  if (["aprovado", "approved", "publicado", "published", "divulgado"].includes(status)) return "Aprovado";
  if (["rascunho", "draft"].includes(status)) return "Rascunho";
  if (["rejeitado", "rejected"].includes(status)) return "Rejeitado";
  return "Aguardando Curadoria";
}
