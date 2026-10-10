import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface AutocompletePage<T> {
  rows: T[];
  hasMore: boolean;
}

export interface UseAutocompleteSearchOptions<T> {
  /** Termo digitado. */
  term: string;
  /** Busca uma página. `from`/`to` são índices inclusivos (range do Supabase). */
  fetchPage: (query: string, from: number, to: number, signal: AbortSignal) => Promise<T[]>;
  /** Itens por página. */
  pageSize?: number;
  /** Debounce em ms para termo digitado (0 quando o campo está vazio). */
  debounceMs?: number;
  /** Mínimo de caracteres para disparar a busca por termo (abaixo disso lista o topo). */
  minChars?: number;
  /** Invalida o cache quando muda (ex.: novo registro criado). */
  refreshKey?: unknown;
  /** Desliga a busca (ex.: dropdown fechado). */
  enabled?: boolean;
}

/**
 * Autocomplete rápido: debounce, cache em memória por termo, cancelamento das
 * requisições antigas (evita resposta fora de ordem) e paginação incremental
 * para listas grandes.
 */
export function useAutocompleteSearch<T>({
  term,
  fetchPage,
  pageSize = 12,
  debounceMs = 180,
  minChars = 1,
  refreshKey,
  enabled = true,
}: UseAutocompleteSearchOptions<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const cache = useRef(new Map<string, AutocompletePage<T>>());
  const abortRef = useRef<AbortController | null>(null);
  const moreAbortRef = useRef<AbortController | null>(null);
  const morePendingRef = useRef(false);
  const seqRef = useRef(0);
  const pageRef = useRef(0);

  const normalized = useMemo(
    () => (term ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim(),
    [term],
  );
  const effectiveTerm = normalized.length >= minChars ? normalized : "";

  // Invalida o cache quando a fonte de dados muda.
  useEffect(() => {
    cache.current.clear();
  }, [refreshKey]);

  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;

  useEffect(() => {
    const seq = ++seqRef.current;
    morePendingRef.current = false;
    setLoadingMore(false);
    if (!enabled) { setLoading(false); return; }
    const cleanup = () => {
      ++seqRef.current;
      abortRef.current?.abort();
      moreAbortRef.current?.abort();
      morePendingRef.current = false;
    };

    const cached = cache.current.get(effectiveTerm);
    if (cached) {
      setItems(cached.rows);
      setHasMore(cached.hasMore);
      pageRef.current = Math.max(0, Math.ceil(cached.rows.length / pageSize) - 1);
      setLoading(false);
      setError(null);
      return cleanup;
    }

    const delay = normalized.length ? debounceMs : 0;
    setLoading(true);
    setError(null);

    const timer = window.setTimeout(async () => {
      // Abortamos apenas quando o timer dispara para evitar abortar
      // requisições que ainda estão sendo debounced se possível, 
      // mas na prática o cleanup do useEffect já faz isso.
      const controller = new AbortController();
      abortRef.current = controller;
      
      try {
        const rows = await fetchRef.current(effectiveTerm, 0, pageSize, controller.signal);
        if (seq !== seqRef.current) return; // resposta obsoleta
        
        const more = rows.length > pageSize;
        const page = { rows: more ? rows.slice(0, pageSize) : rows, hasMore: more };
        cache.current.set(effectiveTerm, page);
        pageRef.current = 0;
        setItems(page.rows);
        setHasMore(page.hasMore);
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        if (seq === seqRef.current) {
          setError(err instanceof Error ? err : new Error("SEARCH_FAILED"));
          setItems([]);
          setHasMore(false);
        }
      } finally {
        if (seq === seqRef.current) setLoading(false);
      }
    }, delay);

    return () => {
      window.clearTimeout(timer);
      cleanup();
    };
  }, [effectiveTerm, normalized, enabled, pageSize, debounceMs, refreshKey]);

  const loadMore = useCallback(async () => {
    if (!enabled || loading || !hasMore || morePendingRef.current) return;
    morePendingRef.current = true;
    setLoadingMore(true);
    setError(null);
    const seq = seqRef.current;
    const nextPage = pageRef.current + 1;
    
    try {
      const controller = new AbortController();
      moreAbortRef.current = controller;
      const rows = await fetchRef.current(
        effectiveTerm,
        nextPage * pageSize,
        nextPage * pageSize + pageSize,
        controller.signal,
      );
      if (seq !== seqRef.current) return;
      const more = rows.length > pageSize;
      const merged = [...items, ...(more ? rows.slice(0, pageSize) : rows)];
      pageRef.current = nextPage;
      cache.current.set(effectiveTerm, { rows: merged, hasMore: more });
      setItems(merged);
      setHasMore(more);
    } catch (err: unknown) {
      if (seq === seqRef.current && !moreAbortRef.current?.signal.aborted) {
        setError(err instanceof Error ? err : new Error("SEARCH_FAILED"));
      }
    } finally {
      if (seq === seqRef.current) {
        morePendingRef.current = false;
        setLoadingMore(false);
      }
    }
  }, [effectiveTerm, enabled, hasMore, items, loading, pageSize]);

  return { items, loading, loadingMore, hasMore, loadMore, error };
}
