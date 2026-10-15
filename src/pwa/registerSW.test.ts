import { afterEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ register: vi.fn(), toast: vi.fn() }));
vi.mock("virtual:pwa-register", () => ({ registerSW: mock.register }));
vi.mock("sonner", () => ({ toast: { custom: mock.toast } }));
import { setupPWA } from "./registerSW";

afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); mock.register.mockClear(); });
function registration(path: string) {
  return { active: { scriptURL: new URL(path, location.origin).href }, unregister: vi.fn().mockResolvedValue(true) };
}
describe("preview PWA safety", () => {
  it("never registers in development and only removes the app worker", async () => {
    vi.stubEnv("PROD", false);
    const app = registration("/sw.js");
    const messaging = registration("/firebase-messaging-sw.js");
    Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: { getRegistrations: vi.fn().mockResolvedValue([app, messaging]) } });
    setupPWA();
    await vi.waitFor(() => expect(app.unregister).toHaveBeenCalled());
    expect(messaging.unregister).not.toHaveBeenCalled();
    expect(mock.register).not.toHaveBeenCalled();
  });
});
