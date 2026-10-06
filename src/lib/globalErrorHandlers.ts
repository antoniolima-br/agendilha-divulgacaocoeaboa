import { logRuntimeError } from "@/lib/runtimeDiagnostics";

let installed = false;

export function installGlobalErrorHandlers() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("unhandledrejection", (event) => {
    logRuntimeError("unhandled-promise", event.reason);
  });

  window.addEventListener("error", (event) => {
    logRuntimeError("global", event.error ?? event.message, {
      detail: { source: event.filename, lineno: event.lineno, colno: event.colno },
    });
  });
}