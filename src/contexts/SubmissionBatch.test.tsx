import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SubmissionProvider, useSubmissions } from "./SubmissionContext";
import type { ReactNode } from "react";

const mocks = vi.hoisted(() => ({ insert: vi.fn(), selectInserted: vi.fn(), from: vi.fn(), user: { id: "owner" } as { id: string } | null }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: mocks.from } }));
const wrapper = ({ children }: { children: ReactNode }) => <SubmissionProvider>{children}</SubmissionProvider>;
beforeEach(() => {
  vi.clearAllMocks();
  mocks.user = { id: "owner" };
  mocks.insert.mockReturnValue({ select: mocks.selectInserted });
  mocks.from.mockReturnValue({ insert: mocks.insert, select: () => ({ eq: () => ({ neq: () => ({ order: async () => ({ data: [], error: null }) }) }) }) });
});
describe("atomic event submission batches", () => {
  it("sends all events in one insert with the active owner", async () => {
    mocks.selectInserted.mockResolvedValue({ data: [{ id: "first" }, { id: "second" }], error: null });
    const { result } = renderHook(() => useSubmissions(), { wrapper });
    await act(async () => {
      expect(await result.current.addSubmissionBatch([{ event_title: "First" }, { event_title: "Second" }])).toEqual([{ id: "first" }, { id: "second" }]);
    });
    expect(mocks.insert).toHaveBeenCalledTimes(1);
    expect(mocks.insert).toHaveBeenCalledWith([{ event_title: "First", user_id: "owner" }, { event_title: "Second", user_id: "owner" }]);
  });
  it("propagates the guard failure without retrying individual rows", async () => {
    mocks.selectInserted.mockResolvedValue({ data: null, error: new Error("FREE_DAILY_QUOTA") });
    const { result } = renderHook(() => useSubmissions(), { wrapper });
    await expect(result.current.addSubmissionBatch([{ event_title: "First" }, { event_title: "Second" }])).rejects.toThrow("FREE_DAILY_QUOTA");
    expect(mocks.insert).toHaveBeenCalledTimes(1);
  });
  it("never writes without an authenticated owner", async () => {
    mocks.user = null;
    const { result } = renderHook(() => useSubmissions(), { wrapper });
    await expect(result.current.addSubmissionBatch([{ event_title: "First" }])).rejects.toThrow("sessão expirou");
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});