import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FlyerDownloadButton } from "./FlyerDownloadButton";
const error = vi.hoisted(() => vi.fn());
vi.mock("sonner", () => ({ toast: { error } }));
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe("flyer download", () => {
  it("downloads the saved full resolution artwork", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(["image"], { type: "image/png" }) }));
    URL.createObjectURL = vi.fn(() => "blob:download");
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function () {
      expect(this.download).toBe("flyer-Samba-do-Domingo.png");
      expect(this.href).toBe("blob:download");
    });
    render(<FlyerDownloadButton url="https://example.test/flyer.png" title="Samba do Domingo" />);
    fireEvent.click(screen.getByRole("button", { name: "Baixar flyer" }));
    await waitFor(() => expect(click).toHaveBeenCalledOnce());
    await waitFor(() => expect(screen.getByRole("button")).toBeEnabled());
  });
  it("shows a retryable error instead of claiming download success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    render(<FlyerDownloadButton url="https://example.test/flyer.jpg" title="Samba" />);
    fireEvent.click(screen.getByRole("button", { name: "Baixar flyer" }));
    await waitFor(() => expect(error).toHaveBeenCalledWith(expect.stringContaining("Não deu pra baixar")));
    expect(screen.getByRole("button")).toBeEnabled();
  });
});