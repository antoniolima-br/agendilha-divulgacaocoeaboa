import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DiscoveryEventCard } from "./DiscoveryEventCard";
vi.mock("@/hooks/useThumbnailCache", () => ({ useThumbnailCache: () => undefined }));
vi.mock("@/components/EventShareButton", () => ({ EventShareButton: () => null }));
const event = { id: "event", event_title: "Show", date: "2026-12-20", start_time: "18:00", location: "Local", address_neighborhood: null, category: "musica", image_url: "/first.webp" };
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
});