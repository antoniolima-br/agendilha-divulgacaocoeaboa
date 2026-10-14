import { describe, expect, it, vi } from "vitest";
import { formatGuestDateTime, guestInviteLink } from "./eventGuests";

describe("event guest invites", () => {
  it("builds an opaque personalized event link", () => {
    vi.stubGlobal("window", { location: { origin: "https://coeaboa.online" } });
    const link = guestInviteLink("roda-de-samba", "event-id", "invite-token", "whatsapp");
    expect(link).toContain("/evento/roda-de-samba?");
    expect(link).toContain("src=whatsapp");
    expect(link).toContain("guest=invite-token");
  });

  it("formats opening time in São Paulo and explains unopened invites", () => {
    expect(formatGuestDateTime(null)).toBe("Ainda não abriu");
    expect(formatGuestDateTime("2026-10-14T20:30:00Z")).toContain("14/10/2026");
  });
});