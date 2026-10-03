import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { handleError } from "@/lib/error-handler";
import { logger } from "@/lib/logger";

export const CACHE_TIME = {
  short: 30_000,
  standard: 60_000,
  long: 5 * 60_000,
} as const;

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      const context = `query:${String(query.queryKey?.[0] ?? "unknown")}`;
      if (query.state.data !== undefined) {
        handleError(error, { fallback: "Não deu pra atualizar os dados. Tenta de novo.", context });
        return;
      }
      logger.error(`[${context}] load failed`, error);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (mutation.options.onError) return;
      handleError(error, {
        fallback: "Não deu pra completar a ação. Tenta de novo.",
        context: `mutation:${String(mutation.options.mutationKey?.[0] ?? "unknown")}`,
      });
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: CACHE_TIME.standard,
      gcTime: CACHE_TIME.long,
      refetchOnWindowFocus: false,
      retry: (failureCount, error: unknown) => {
        const candidate = error as { status?: number; code?: string } | null;
        if (candidate?.status === 404 || candidate?.status === 403 || candidate?.code === "PGRST116") {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});