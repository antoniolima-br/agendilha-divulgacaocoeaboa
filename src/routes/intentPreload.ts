/** Preload allowlisted public code/data on intent; never protected data or all routes. */
export function installIntentPreload(
  loaders: Record<string, () => Promise<unknown>>,
  prefetchers: Record<string, () => Promise<unknown>> = {},
) {
  const pending = new Set<string>();
  const prefetching = new Set<string>();
  const intent = (event: Event) => {
    if (!(event.target instanceof Element)) return;
    const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
    if (!anchor || anchor.hasAttribute("download") || anchor.target === "_blank") return;
    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    const key = url.pathname.startsWith("/evento/") && url.pathname.split("/").filter(Boolean).length === 2
      ? "/evento/:slug" : url.pathname;
    const load = loaders[key];
    if (!load) return;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (connection?.saveData || connection?.effectiveType === "2g" || connection?.effectiveType === "slow-2g") return;
    if (!pending.has(key)) {
      pending.add(key);
      void load().catch(() => pending.delete(key));
    }
    const prefetch = prefetchers[key];
    if (prefetch && !prefetching.has(key)) {
      prefetching.add(key);
      void prefetch().catch(() => undefined).finally(() => prefetching.delete(key));
    }
  };
  const events = ["pointerover", "focusin", "pointerdown"] as const;
  events.forEach((event) => document.addEventListener(event, intent, { passive: true }));
  return () => events.forEach((event) => document.removeEventListener(event, intent));
}