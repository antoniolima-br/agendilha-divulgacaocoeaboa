import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DiscoveryEventCard } from "./DiscoveryEventCard";
vi.mock("@/hooks/useThumbnailCache", () => ({ useThumbnailCache: () => undefined }));
vi.mock("@/components/EventShareButton", () => ({ EventShareButton: () => null }));
const event = { id: "event", event_title: "Show", date: "2026-12-20", start_time: "18:00", location: "Local", address_neighborhood: null, category: "musica", image_url: "/first.webp" };
afterEach(() => vi.useRealTimers());
describe("discovery flyer rendering", () => {
  it("keeps the official artwork, avoids blur and restores a replacement after failure", () => {
    const { rerender } = render(<DiscoveryEventCard event={event} onClick={vi.fn()} variant="small" />);
    const image = screen.getByRole("img", { name: "Show" });
    expect(image).toHaveAttribute("loading", "lazy");
    expect(image.className).not.toContain("blur");
    fireEvent.error(image);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    rerender(<DiscoveryEventCard event={{ ...event, image_url: "/replacement.webp" }} onClick={vi.fn()} variant="small" />);
    expect(screen.getByRole("img")).toHaveAttribute("src", "/replacement.webp");
  });
  it("retries the official art if its paired thumbnail is unavailable", () => {
    render(<DiscoveryEventCard event={{ ...event, image_url: "/art.flyer.jpeg" }} onClick={vi.fn()} />);
    fireEvent.error(screen.getByRole("img"));
    expect(screen.getByRole("img")).toHaveAttribute("src", "/art.flyer.jpeg");
    fireEvent.error(screen.getByRole("img"));
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
  it("keeps the current São Paulo day when UTC has already turned midnight", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-16T01:00:00Z"));
    const { rerender } = render(<DiscoveryEventCard event={{ ...event, date: "2026-10-15" }} onClick={vi.fn()} />);
    expect(screen.getByText("Hoje")).toBeInTheDocument();
    rerender(<DiscoveryEventCard event={{ ...event, date: "2026-10-16" }} onClick={vi.fn()} />);
    expect(screen.queryByText("Hoje")).not.toBeInTheDocument();
  });
});