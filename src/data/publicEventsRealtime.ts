import { useEffect } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { qk } from "./queryKeys";
import { createQueryInvalidationBatch } from "@/lib/queryInvalidationBatch";

const subscriptions = new WeakMap<QueryClient, { users: number; cleanup: () => void }>();
let sequence = 0;

/** Calendar, Home and Agenda share a single batched public-event subscription. */
export function usePublicEventsRealtime(enabled = true) {
  const client = useQueryClient();
  useEffect(() => {
    if (!enabled) return;
    let shared = subscriptions.get(client);
    if (!shared) {
      const batch = createQueryInvalidationBatch((queryKey) => { void client.invalidateQueries({ queryKey }); });
      let channel: ReturnType<typeof supabase.channel> | undefined;
      const connect = () => {
        channel = supabase.channel(`public-events:${++sequence}`)
          .on("postgres_changes", { event: "*", schema: "public", table: "submissions" }, () => batch.schedule(qk.agenda.events()))
          .subscribe();
      };
      const idle = window.requestIdleCallback?.(connect, { timeout: 2000 });
      const timer = idle === undefined ? window.setTimeout(connect, 1200) : undefined;
      shared = { users: 0, cleanup: () => {
        if (idle !== undefined) window.cancelIdleCallback?.(idle);
        if (timer !== undefined) window.clearTimeout(timer);
        batch.cancel();
        if (channel) void supabase.removeChannel(channel);
      } };
      subscriptions.set(client, shared);
    }
    shared.users++;
    return () => {
      shared.users--;
      if (shared.users === 0) {
        shared.cleanup();
        subscriptions.delete(client);
      }
    };
  }, [client, enabled]);
}