import { registerSW } from "virtual:pwa-register";
import { toast } from "sonner";
import { createElement } from "react";
import { PwaUpdateNotice } from "@/components/system/PwaUpdateNotice";
import { isAppRegistration, runAppUpdate } from "./updateApp";
import { releaseLegacyFlyerCache } from "./cachePolicy";

function isPreviewOrDev(): boolean {
  if (!import.meta.env.PROD || typeof window === "undefined") return true;
  try { if (window.self !== window.top) return true; } catch { return true; }
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return true;
  if (host.startsWith("id-preview--") || host.startsWith("preview--")) return true;
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return true;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return true;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return true;
  return new URLSearchParams(window.location.search).get("sw") === "off";
}

async function unregisterMatchingSWs() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.filter(isAppRegistration).map(r => r.unregister()));
  } catch { /* preview cleanup is best-effort */ }
}

export function setupPWA() {
  if (typeof window === "undefined") return;
  if (isPreviewOrDev()) { void unregisterMatchingSWs(); return; }
  if (!("serviceWorker" in navigator)) return;

  let cleanupListeners: (() => void) | undefined;
  let applying = false;
  registerSW({
    immediate: true,
    onNeedRefresh() {
      toast.custom(() => createElement(PwaUpdateNotice, {
        apply: async () => {
          if (applying) return false;
          applying = true;
          try {
            const result = await runAppUpdate();
            if (result.status !== "sw-activated") return false;
            window.location.reload();
            return true;
          } finally { applying = false; }
        },
      }), { id: "pwa-update", duration: Infinity, position: "top-center" });
    },
    onRegistered(registration) {
      if (!registration) return;
      if ("caches" in window) void releaseLegacyFlyerCache(window.caches).catch(() => undefined);
      cleanupListeners?.();
      let checking = false;
      const checkForUpdate = () => {
        if (checking || document.visibilityState !== "visible" || !navigator.onLine) return;
        checking = true;
        void registration.update().catch(() => undefined).finally(() => { checking = false; });
      };
      document.addEventListener("visibilitychange", checkForUpdate);
      window.addEventListener("focus", checkForUpdate);
      window.addEventListener("pageshow", checkForUpdate);
      window.addEventListener("online", checkForUpdate);
      const intervalId = window.setInterval(checkForUpdate, 10 * 60 * 1000);
      checkForUpdate();
      cleanupListeners = () => {
        document.removeEventListener("visibilitychange", checkForUpdate);
        window.removeEventListener("focus", checkForUpdate);
        window.removeEventListener("pageshow", checkForUpdate);
        window.removeEventListener("online", checkForUpdate);
        window.clearInterval(intervalId);
      };
    },
  });
  // Keep checks after a mobile pagehide/pageshow back-forward-cache restore.
  return () => cleanupListeners?.();
}
