import type { QueryClient } from "@tanstack/react-query";
import { qk } from "./queryKeys";

export async function invalidateProfileDerived(client: QueryClient, userId: string): Promise<void> {
  await Promise.all([
    client.invalidateQueries({ queryKey: qk.permissions.byUser(userId) }),
    client.invalidateQueries({ queryKey: qk.divulgador.status(userId) }),
  ]);
}

export async function invalidateCollaboratorDerived(client: QueryClient, userId?: string | null): Promise<void> {
  const invalidations = [
    client.invalidateQueries({ queryKey: qk.collaborators.all }),
    client.invalidateQueries({ queryKey: qk.permissions.all }),
    client.invalidateQueries({ queryKey: qk.divulgador.all }),
  ];

  if (userId) {
    invalidations.push(client.invalidateQueries({ queryKey: qk.userDetails.byId(userId) }));
  } else {
    invalidations.push(client.invalidateQueries({ queryKey: qk.userDetails.all }));
  }

  await Promise.all(invalidations);
}