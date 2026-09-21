import { useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAutocompleteSearch } from "@/hooks/useAutocompleteSearch";

const normalizeSearch = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();

export interface FieldSuggestionSource {
  /** Tabela ou view pública já protegida por RLS. */
  from: string;
  /** Coluna com o texto sugerido. */
  column: string;
}

interface Options extends FieldSuggestionSource {
  term: string;
  enabled?: boolean;
  limit?: number;
  /** Muda para invalidar o cache (ex.: registro editado/aprovado/excluído). */
  refreshKey?: unknown;
}

/**
 * Sugestões de valores já cadastrados no banco para um campo de texto.
 * Silencioso por natureza: se a RLS bloquear a leitura, devolve lista vazia
 * e o campo continua funcionando como input normal.
 */
export function useFieldSuggestions({
  from,
  column,
  term,
  enabled = true,
  limit = 8,
  refreshKey,
}: Options) {
  const fetchPage = useCallback(
    async (q: string, start: number, end: number, signal: AbortSignal) => {
      const query = supabase
        .from(from as never)
        .select(column)
        .not(column, "is", null)
        .order(column, { ascending: true })
        .range(0, Math.max(end, 249))
        .abortSignal(signal);
      const { data, error } = await query;
      if (error) return [];
      const normalizedQuery = normalizeSearch(q);
      return ((data ?? []) as Record<string, unknown>[])
        .filter((row) => {
          const value = row?.[column];
          return typeof value === "string" && (!normalizedQuery || normalizeSearch(value).includes(normalizedQuery));
        })
        .slice(start, end + 1);
    },
    [from, column],
  );

  const { items, loading } = useAutocompleteSearch<Record<string, unknown>>({
    term,
    fetchPage,
    pageSize: limit * 3,
    debounceMs: 200,
    minChars: 0,
    enabled,
    refreshKey,
  });

  const suggestions = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const row of items) {
      const raw = row?.[column];
      if (typeof raw !== "string") continue;
      const value = raw.trim();
      if (!value) continue;
       const key = normalizeSearch(value);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(value);
      if (out.length >= limit) break;
    }
    return out;
  }, [items, column, limit]);

  return { suggestions, loading };
}