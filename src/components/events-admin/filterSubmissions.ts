import type { Submission } from "./types";

export type SubmissionFilters = { category: string; editorial: string; search: string };

/** Filtros do painel de Envios: categoria, etapa editorial e busca por texto. */
export function filterSubmissions(list: Submission[], { category, editorial, search }: SubmissionFilters): Submission[] {
  let result = [...list];
  if (category !== "all") result = result.filter((s) => s.category === category);
  if (editorial !== "all") result = result.filter((s) => (s.editorial_status || "recebido") === editorial);
  if (search.trim()) {
    const q = search.toLowerCase();
    result = result.filter((s) =>
      s.event_title.toLowerCase().includes(q) ||
      (s.company_name || "").toLowerCase().includes(q) ||
      (s.location || "").toLowerCase().includes(q) ||
      (s.responsible_name || "").toLowerCase().includes(q),
    );
  }
  return result;
}
