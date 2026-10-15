import { useEffect } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { qk } from "./queryKeys";
import { createSharedResource } from "@/lib/sharedResource";


const acquireRefreshClock = createSharedResource<QueryClient>((client) => {
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
  return () => {
    clearTimeout(timer);
    document.removeEventListener("visibilitychange", visibility);
  };
});

/** One visible-tab clock per client, regardless of public ad placements mounted. */
export function usePublicAdsRefresh() {
  const client = useQueryClient();
  useEffect(() => acquireRefreshClock(client), [client]);
}
