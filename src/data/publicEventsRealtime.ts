import { useEffect } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { qk } from "./queryKeys";
import { createSharedResource } from "@/lib/sharedResource";
import { createQueryInvalidationBatch } from "@/lib/queryInvalidationBatch";

let sequence = 0;

const acquireSubscription = createSharedResource<QueryClient>((client) => {
  const batch = createQueryInvalidationBatch((queryKey) => { void client.invalidateQueries({ queryKey }); });
  let channel: ReturnType<typeof supabase.channel> | undefined;
  const connect = () => {
    channel = supabase.channel(`public-events:${++sequence}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "submissions" }, () => {
        batch.schedule(qk.agenda.all);
        batch.schedule(qk.home.all);
        batch.schedule(qk.submissions.all);
        batch.schedule(qk.curation.all);
        batch.schedule(qk.intranet.all);
      })
      .subscribe();
  };
  const idle = window.requestIdleCallback?.(connect, { timeout: 2000 });
  const timer = idle === undefined ? window.setTimeout(connect, 1200) : undefined;
  return () => {
    if (idle !== undefined) window.cancelIdleCallback?.(idle);
    if (timer !== undefined) window.clearTimeout(timer);
    batch.cancel();
    if (channel) void supabase.removeChannel(channel);
  };
});

/** Calendar, Home and Agenda share a single batched public-event subscription. */
export function usePublicEventsRealtime(enabled = true) {
  const client = useQueryClient();
  useEffect(() => {
    if (!enabled) return;
    return acquireSubscription(client);
  }, [client, enabled]);
}
