import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ShareDialog } from "./ShareDialog";

const toastMocks = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock("sonner", () => ({ toast: toastMocks }));
const props = { open: true, onOpenChange: vi.fn(), title: "Rolê", text: "Hoje às 18h", url: "https://coeaboa.online/evento/example", onShare: vi.fn() };
afterEach(() => { vi.clearAllMocks(); Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined }); });
describe("sharing fallback", () => {
  it("copies only the event link and reports successful completion", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<ShareDialog {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Copiar link" }));
    await waitFor(() => expect(props.onShare).toHaveBeenCalledWith("copy"));
    expect(writeText).toHaveBeenCalledWith(props.url);
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });
  it("keeps the dialog open and gives a next step when clipboard is unavailable", async () => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
    render(<ShareDialog {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Copiar link" }));
    await waitFor(() => expect(toastMocks.error).toHaveBeenCalled());
    expect(props.onShare).not.toHaveBeenCalled();
    expect(props.onOpenChange).not.toHaveBeenCalled();
  });
  it("encodes WhatsApp content with a safe new window", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    render(<ShareDialog {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "WhatsApp" }));
    expect(open).toHaveBeenCalledWith(`https://wa.me/?text=${encodeURIComponent(`${props.text}\n${props.url}`)}`, "_blank", "noopener,noreferrer");
    open.mockRestore();
  });
});