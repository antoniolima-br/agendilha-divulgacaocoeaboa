import { useEffect } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { qk } from "./queryKeys";

const refreshers = new WeakMap<QueryClient, { consumers: number; stop: () => void }>();

/** One visible-tab clock per client, regardless of public ad placements mounted. */
export function usePublicAdsRefresh() {
  const client = useQueryClient();
  useEffect(() => {
    let shared = refreshers.get(client);
    if (!shared) {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const refresh = () => {
        if (document.visibilityState !== "hidden") {
          void client.invalidateQueries({ queryKey: qk.ads.published() });
        }
        schedule();
      };
      const schedule = () => {
        clearTimeout(timer);
        timer = document.visibilityState === "hidden" ? undefined : setTimeout(refresh, 60_000);
      };
      const visibility = () => {
        if (document.visibilityState !== "hidden") refresh();
        else schedule();
      };
      document.addEventListener("visibilitychange", visibility);
      schedule();
      shared = { consumers: 0, stop: () => {
        clearTimeout(timer);
        document.removeEventListener("visibilitychange", visibility);
      } };
      refreshers.set(client, shared);
    }
    shared.consumers++;
    return () => {
      shared.consumers--;
      if (shared.consumers === 0) {
        shared.stop();
        refreshers.delete(client);
      }
    };
  }, [client]);
}