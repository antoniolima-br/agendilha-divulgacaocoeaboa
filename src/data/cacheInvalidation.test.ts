import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { qk } from "./queryKeys";
import { invalidateCollaboratorDerived, invalidateProfileDerived } from "./cacheInvalidation";

function createClient() {
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, "invalidateQueries").mockResolvedValue();
  return { client, invalidate };
}

describe("derived cache invalidation", () => {
  it("refreshes permissions and promoter status after a profile change", async () => {
    const { client, invalidate } = createClient();

    await invalidateProfileDerived(client, "user-1");

    expect(invalidate).toHaveBeenCalledWith({ queryKey: qk.permissions.byUser("user-1") });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: qk.divulgador.status("user-1") });
  });

  it("refreshes every collaborator-derived response for one account", async () => {
    const { client, invalidate } = createClient();

    await invalidateCollaboratorDerived(client, "user-2");

    expect(invalidate).toHaveBeenCalledWith({ queryKey: qk.collaborators.all });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: qk.permissions.all });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: qk.divulgador.all });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: qk.userDetails.byId("user-2") });
  });
});