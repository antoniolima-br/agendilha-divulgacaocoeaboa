import { logger } from "@/lib/logger";

/**
 * Registro padronizado de falhas de execução. Inclui rota, área da tela,
 * mensagem, pilha e (quando houver) a pilha de componentes do React,
 * para facilitar o diagnóstico sem expor dados sensíveis do formulário.
 */
export function logRuntimeError(
  area: string,
  error: unknown,
  extra?: { componentStack?: string | null; step?: number | string; detail?: Record<string, unknown> },
) {
  const err = error instanceof Error ? error : null;
  const raw = error as { code?: string; details?: string; hint?: string; message?: string } | null;
  logger.error(`[runtime:${area}] ${err?.message ?? raw?.message ?? String(error)}`, {
    area,
    route: typeof window !== "undefined" ? window.location.pathname : undefined,
    at: new Date().toISOString(),
    name: err?.name,
    code: raw?.code,
    details: raw?.details,
    hint: raw?.hint,
    step: extra?.step,
    stack: err?.stack?.split("\n").slice(0, 6).join("\n"),
    componentStack: extra?.componentStack?.split("\n").slice(0, 8).join("\n"),
    ...extra?.detail,
  });
}
