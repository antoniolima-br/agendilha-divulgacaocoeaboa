import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DiscoveryEventCard } from "./DiscoveryEventCard";
import { HighlightCard } from "./agenda/HighlightCard";
import { RecommendationCard } from "./agenda/RecommendationCard";
import { Music } from "lucide-react";

vi.mock("@/components/FavoriteButton", () => ({ FavoriteButton: () => null }));
vi.mock("@/hooks/useThumbnailCache", () => ({ useThumbnailCache: () => null }));
vi.mock("@/components/agenda/EventImage", () => ({ EventImage: () => null }));
const event = { id: "published-event", event_title: "Show Cultural", date: "2026-12-20", start_time: "18:00", end_time: null, location: "Espaço Cultural", address_neighborhood: "Centro", address_street: null, description: null, category: "musica", is_highlight: true };
afterEach(() => Object.defineProperty(navigator, "share", { configurable: true, value: undefined }));
describe("public card sharing", () => {
  for (const type of ["discovery", "highlight", "recommendation"]) {
    it(`${type} shares natively without opening event details`, async () => {
      const share = vi.fn().mockResolvedValue(undefined), select = vi.fn();
      Object.defineProperty(navigator, "share", { configurable: true, value: share });
      render(type === "discovery" ? <DiscoveryEventCard event={event} onClick={select} /> : type === "highlight" ? <HighlightCard event={event} onSelect={select} trackView={vi.fn()} onShare={vi.fn()} /> : <RecommendationCard event={event} onSelect={select} icon={Music} caption="Hoje" onShare={vi.fn()} />);
      fireEvent.click(screen.getByRole("button", { name: "Compartilhar evento" }));
      await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
      expect(select).not.toHaveBeenCalled();
      expect(share.mock.calls[0][0].url).toContain("/agenda?event=published-event");
    });
  }
  it("copies the event link from the fallback without opening the parent card", async () => {
    const select = vi.fn(), copy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: copy } });
    render(<DiscoveryEventCard event={event} onClick={select} />);
    fireEvent.click(screen.getByRole("button", { name: "Compartilhar evento" }));
    fireEvent.click(await screen.findByRole("button", { name: "Copiar link" }));
    await waitFor(() => expect(copy).toHaveBeenCalledTimes(1));
    expect(select).not.toHaveBeenCalled();
  });
});