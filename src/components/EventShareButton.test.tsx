import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EventShareButton } from "./EventShareButton";

vi.mock("@/components/ShareDialog", () => ({ ShareDialog: ({ open }: { open: boolean }) => open ? <div role="dialog">WhatsApp / Copiar link</div> : null }));
const props = { title: "Rolê", text: "Hoje às 18h", url: "https://coeaboa.online/evento/example" };
afterEach(() => { Object.defineProperty(navigator, "share", { configurable: true, value: undefined }); });
describe("event sharing", () => {
  it("uses native sharing before fallback", async () => {
    const share = vi.fn().mockResolvedValue(undefined), onShared = vi.fn();
    Object.defineProperty(navigator, "share", { configurable: true, value: share });
    render(<EventShareButton {...props} onShared={onShared} />);
    fireEvent.click(screen.getByRole("button", { name: "Compartilhar evento" }));
    await waitFor(() => expect(onShared).toHaveBeenCalledTimes(1));
    expect(share).toHaveBeenCalledWith(props);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("keeps cancellation silent", async () => {
    const share = vi.fn().mockRejectedValue(new DOMException("cancelled", "AbortError"));
    Object.defineProperty(navigator, "share", { configurable: true, value: share });
    render(<EventShareButton {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Compartilhar evento" }));
    await waitFor(() => expect(share).toHaveBeenCalled());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("opens fallback when native sharing fails", async () => {
    Object.defineProperty(navigator, "share", { configurable: true, value: vi.fn().mockRejectedValue(new Error("unavailable")) });
    render(<EventShareButton {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Compartilhar evento" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
});