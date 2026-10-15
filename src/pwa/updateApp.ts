/** Only update the app-shell worker; preserve local data and other workers. */
export type UpdateResult =
  | { status: "offline" }
  | { status: "unstable" }
  | { status: "sw-activated" }
  | { status: "reload-only" };

export function isAppRegistration(registration: ServiceWorkerRegistration): boolean {
  return [registration.active, registration.waiting, registration.installing].some(worker => {
    if (!worker) return false;
    const url = new URL(worker.scriptURL);
    return url.origin === window.location.origin && url.pathname === "/sw.js";
  });
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | "timeout"> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([promise, new Promise<"timeout">((resolve) => {
      timer = setTimeout(() => resolve("timeout"), ms);
    })]);
  } finally { clearTimeout(timer); }
}

export interface UpdateDeps {
  onLine: boolean;
  serviceWorker?: ServiceWorkerContainer;
  caches?: CacheStorage;
  updateTimeoutMs?: number;
}

async function activateWorker(sw: ServiceWorkerContainer, worker: ServiceWorker, ms: number): Promise<UpdateResult> {
  let controlled: () => void = () => undefined;
  const changed = new Promise<"controlled">((resolve) => {
    controlled = () => {
      if (sw.controller?.scriptURL === worker.scriptURL) resolve("controlled");
    };
    sw.addEventListener("controllerchange", controlled);
  });
  try {
    worker.postMessage({ type: "SKIP_WAITING" });
    return await withTimeout(changed, ms) === "controlled" ? { status: "sw-activated" } : { status: "unstable" };
  } catch { return { status: "unstable" }; }
  finally { sw.removeEventListener("controllerchange", controlled); }
}

export async function runAppUpdate(deps?: Partial<UpdateDeps>): Promise<UpdateResult> {
  const onLine = deps?.onLine ?? (typeof navigator !== "undefined" ? navigator.onLine : true);
  if (!onLine) return { status: "offline" };
  const sw = deps?.serviceWorker ?? (typeof navigator !== "undefined" && "serviceWorker" in navigator ? navigator.serviceWorker : undefined);
  if (!sw) return { status: "reload-only" };
  const timeoutMs = deps?.updateTimeoutMs ?? 10000;
  let regs: readonly ServiceWorkerRegistration[];
  try { regs = (await sw.getRegistrations()).filter(isAppRegistration); }
  catch { return { status: "unstable" }; }
  const waiting = regs.find(r => r.waiting)?.waiting;
  if (waiting) return activateWorker(sw, waiting, timeoutMs);

  const results = await Promise.all(regs.map(r => withTimeout(r.update().then(() => "ok").catch(() => "err"), timeoutMs)));
  if (results.some(r => r === "timeout" || r === "err")) return { status: "unstable" };
  let refreshed: readonly ServiceWorkerRegistration[];
  try { refreshed = (await sw.getRegistrations()).filter(isAppRegistration); }
  catch { return { status: "unstable" }; }
  const next = refreshed.find(r => r.waiting)?.waiting;
  if (next) return activateWorker(sw, next, timeoutMs);
  // update() may finish before downloading/installing. Never reload prematurely.
  if (refreshed.some(r => r.installing)) return { status: "unstable" };
  // No manual Cache Storage deletion: generated Workbox owns its own cache lifecycle.
  return { status: "reload-only" };
}
