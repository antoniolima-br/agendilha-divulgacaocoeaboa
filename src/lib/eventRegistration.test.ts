import { beforeEach, describe, expect, it, vi } from "vitest";
import { batchRegistrationIssue, checkEventRegistration, registrationCode, type RegistrationEvent } from "./eventRegistration";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc } }));
const event: RegistrationEvent = { date: "2026-12-20", start_time: "18:00", location: "Espaço Cultural", atrativo_name: "Banda A", promotion_choice: "free" };
beforeEach(() => rpc.mockReset());
describe("event registration", () => {
  it("blocks same-day free events at a normalized venue", () => {
    expect(batchRegistrationIssue([event, { ...event, location: "espaco cultural", start_time: "22:00", atrativo_name: "Banda B" }])).toBe("FREE_DAILY_QUOTA");
  });
  it("blocks the same free attraction at different venues", () => {
    expect(batchRegistrationIssue([event, { ...event, location: "Outro espaço", start_time: "22:00" }])).toBe("FREE_DAILY_QUOTA");
  });
  it("permits sponsored distinct attractions and times", () => {
    expect(batchRegistrationIssue([{ ...event, promotion_choice: "highlight" }, { ...event, promotion_choice: "highlight", start_time: "22:00", atrativo_name: "Banda B" }])).toBeNull();
  });
  it("still blocks sponsored duplicate start times", () => {
    expect(batchRegistrationIssue([{ ...event, promotion_choice: "highlight" }, { ...event, promotion_choice: "highlight", atrativo_name: "Banda B" }])).toBe("DUPLICATE_EVENT_START");
  });
  it("allows free events on different days", () => {
    expect(batchRegistrationIssue([event, { ...event, date: "2026-12-21" }])).toBeNull();
  });
  it("checks the server and surfaces only the issue code", async () => {
    rpc.mockResolvedValue({ data: { code: "DUPLICATE_EVENT", index: 0 }, error: null });
    expect(await checkEventRegistration([event])).toBe("DUPLICATE_EVENT");
    expect(rpc).toHaveBeenCalledWith("check_event_registration", { p_events: [event] });
  });
  it("avoids calling the server for a blocked batch", async () => {
    expect(await checkEventRegistration([event, { ...event, start_time: "22:00" }])).toBe("FREE_DAILY_QUOTA");
    expect(rpc).not.toHaveBeenCalled();
  });
  it("fails closed on unavailable validation", async () => {
    rpc.mockResolvedValue({ data: null, error: new Error("offline") });
    await expect(checkEventRegistration([event])).rejects.toThrow("offline");
  });
  it("maps guarded insert errors without confusing duplicate codes", () => {
    expect(registrationCode({ message: "DUPLICATE_EVENT_START" })).toBe("DUPLICATE_EVENT_START");
    expect(registrationCode(null)).toBeNull();
  });
});