import { describe, it, expect, vi } from "vitest";
import { runAppUpdate } from "./updateApp";

function fixture(path = "/sw.js", waiting = true) {
  const sw = new EventTarget() as EventTarget & { controller: unknown; getRegistrations: ReturnType<typeof vi.fn> };
  sw.controller = null;
  const worker = { scriptURL: new URL(path, window.location.origin).href, postMessage: vi.fn() };
  const reg = { active: worker, waiting: waiting ? worker : null, installing: null, update: vi.fn().mockResolvedValue(undefined) };
  sw.getRegistrations = vi.fn().mockResolvedValue([reg]);
  return { sw: sw as unknown as ServiceWorkerContainer, worker, reg };
}

describe("confirmed PWA updates", () => {
  it("does not modify anything offline", async () => {
    const { sw, worker } = fixture();
    expect(await runAppUpdate({ serviceWorker: sw, onLine: false })).toEqual({ status: "offline" });
    expect(worker.postMessage).not.toHaveBeenCalled();
  });
  it("sends skipWaiting but waits for controllerchange before reporting activation", async () => {
    const { sw, worker } = fixture();
    let resolved = false;
    const result = runAppUpdate({ serviceWorker: sw, onLine: true }).then(r => { resolved = true; return r; });
    await vi.waitFor(() => expect(worker.postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" }));
    expect(resolved).toBe(false);
    Object.defineProperty(sw, "controller", { value: worker, configurable: true });
    sw.dispatchEvent(new Event("controllerchange"));
    expect(await result).toEqual({ status: "sw-activated" });
  });
  it("does not claim success if the new worker never takes control", async () => {
    const { sw } = fixture();
    expect(await runAppUpdate({ serviceWorker: sw, onLine: true, updateTimeoutMs: 5 })).toEqual({ status: "unstable" });
  });
  it("does not update messaging workers", async () => {
    const { sw, worker, reg } = fixture("/firebase-messaging-sw.js");
    expect(await runAppUpdate({ serviceWorker: sw, onLine: true })).toEqual({ status: "reload-only" });
    expect(worker.postMessage).not.toHaveBeenCalled();
    expect(reg.update).not.toHaveBeenCalled();
  });
  it("preserves caches and local data even when no newer version exists", async () => {
    const { sw } = fixture("/sw.js", false);
    const caches = { keys: vi.fn(), delete: vi.fn() } as unknown as CacheStorage;
    expect(await runAppUpdate({ serviceWorker: sw, onLine: true, caches })).toEqual({ status: "reload-only" });
    expect(caches.keys).not.toHaveBeenCalled();
    expect(caches.delete).not.toHaveBeenCalled();
  });
  it("does not reload while installation is in progress", async () => {
    const { sw, reg, worker } = fixture("/sw.js", false);
    Object.assign(reg, { installing: worker });
    expect(await runAppUpdate({ serviceWorker: sw, onLine: true })).toEqual({ status: "unstable" });
  });
  it("recovers from a failed version check", async () => {
    const { sw, reg } = fixture("/sw.js", false);
    reg.update.mockRejectedValue(new Error("offline"));
    expect(await runAppUpdate({ serviceWorker: sw, onLine: true })).toEqual({ status: "unstable" });
  });
});
