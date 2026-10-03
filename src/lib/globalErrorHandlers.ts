import { logger } from "@/lib/logger";

let installed = false;

export function installGlobalErrorHandlers() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("unhandledrejection", (event) => {
    logger.error("Unhandled promise rejection:", event.reason);
  });

  window.addEventListener("error", (event) => {
    logger.error("Global error:", {
      message: event.message,
      source: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
    });
  });
}