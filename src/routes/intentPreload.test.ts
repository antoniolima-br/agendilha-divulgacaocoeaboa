import { afterEach, describe, expect, it, vi } from "vitest";
import { installIntentPreload } from "./intentPreload";

afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });
describe("public route intent", () => {
  it("loads once per public destination and never on unrelated/external links", async () => {
    const load = vi.fn().mockResolvedValue({});
    const detail = vi.fn().mockResolvedValue({});
    const stop = installIntentPreload({ "/agenda": load, "/evento/:slug": detail });
    document.body.innerHTML = '<a href="/agenda"><span>Agenda</span></a><a href="/admin/events">Admin</a><a href="https://example.com/agenda">External</a><a href="/evento/real">Event</a><a href="/evento/real/imprimir">Print</a>';
    for (const anchor of document.querySelectorAll("a")) {
      anchor.dispatchEvent(new Event("pointerover", { bubbles: true }));
      anchor.dispatchEvent(new Event("focusin", { bubbles: true }));
    }
    expect(load).toHaveBeenCalledTimes(1);
    expect(detail).toHaveBeenCalledTimes(1);
    stop();
    document.querySelector("a")?.dispatchEvent(new Event("pointerover", { bubbles: true }));
    expect(load).toHaveBeenCalledTimes(1);
  });
  it("respects data-saving mode", () => {
    Object.defineProperty(navigator, "connection", { configurable: true, value: { saveData: true } });
    const load = vi.fn();
    const stop = installIntentPreload({ "/agenda": load });
    const anchor = document.createElement("a");
    anchor.href = "/agenda";
    document.body.append(anchor);
    anchor.dispatchEvent(new Event("pointerover", { bubbles: true }));
    expect(load).not.toHaveBeenCalled();
    stop();
    Reflect.deleteProperty(navigator, "connection");
  });
});