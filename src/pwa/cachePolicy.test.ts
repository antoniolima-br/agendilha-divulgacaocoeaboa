import { expect, it, vi } from "vitest";
import { releaseLegacyFlyerCache } from "./cachePolicy";
it("removes only the previous app flyer cache, never messaging or session data", async () => {
  const remove = vi.fn().mockResolvedValue(true);
  await releaseLegacyFlyerCache({ delete: remove });
  expect(remove.mock.calls).toEqual([["app-images"]]);
});