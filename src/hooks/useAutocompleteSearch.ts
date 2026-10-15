import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface AutocompletePage<T> {
  rows: T[];
  hasMore: boolean;
}

export interface UseAutocompleteSearchOptions<T> {
  term: string;
  fetchPage: (query: string, from: number, to: number, signal: AbortSignal) => Promise<T[]>;
  pageSize?: number;
  debounceMs?: number;
  minChars?: number;
  refreshKey?: unknown;
  enabled?: boolean;
  maxCachedTerms?: number;
}

export function useAutocompleteSearch<T>({
  term,
  fetchPage,
  pageSize = 12,
  debounceMs = 180,
  minChars = 1,
  refreshKey,
  enabled = true,
  maxCachedTerms = 30,
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
  const remember = useCallback((key: string, page: AutocompletePage<T>) => {
    cache.current.delete(key);
    cache.current.set(key, page);
    const limit = Math.max(1, Math.floor(maxCachedTerms) || 30);
    while (cache.current.size > limit) {
      const oldest = cache.current.keys().next();
      if (oldest.done) break;
      cache.current.delete(oldest.value);
    }
  }, [maxCachedTerms]);

  useEffect(() => {
    cache.current.clear();
  }, [refreshKey, pageSize]);

  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;

  useEffect(() => {
    const seq = ++seqRef.current;
    morePendingRef.current = false;
    setLoadingMore(false);
    
    const cleanup = () => {
      ++seqRef.current;
      abortRef.current?.abort();
      moreAbortRef.current?.abort();
      morePendingRef.current = false;
    };

    if (!enabled) { 
      setLoading(false); 
      setItems([]);
      setHasMore(false);
      return cleanup; 
    }

    const cached = cache.current.get(effectiveTerm);
    if (cached) {
      remember(effectiveTerm, cached);
      setItems(cached.rows);
      setHasMore(cached.hasMore);
      pageRef.current = Math.max(0, Math.ceil(cached.rows.length / pageSize) - 1);
      setLoading(false);
      setError(null);
      return cleanup;
    }

    // Clear items immediately if not in cache to avoid showing stale results for the previous term
    setItems([]);
    setHasMore(false);
    setLoading(true);
    setError(null);

    const delay = normalized.length ? debounceMs : 0;
    const timer = window.setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      
      try {
        const rows = await fetchRef.current(effectiveTerm, 0, pageSize, controller.signal);
        if (seq !== seqRef.current) return;
        
        const more = rows.length > pageSize;
        const page = { rows: more ? rows.slice(0, pageSize) : rows, hasMore: more };
        remember(effectiveTerm, page);
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
  }, [effectiveTerm, normalized, enabled, pageSize, debounceMs, refreshKey, remember]);

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
      remember(effectiveTerm, { rows: merged, hasMore: more });
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
  }, [effectiveTerm, enabled, hasMore, items, loading, pageSize, remember]);

  return { items, loading, loadingMore, hasMore, loadMore, error };
}
