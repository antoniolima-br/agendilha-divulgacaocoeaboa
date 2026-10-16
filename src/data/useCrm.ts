import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { qk } from "./queryKeys";

export const INTEREST_STATUSES = ["interessado", "confirmado", "compareceu", "cancelado"] as const;
export type InterestStatus = (typeof INTEREST_STATUSES)[number];
export const INTEREST_LABEL: Record<InterestStatus, string> = {
  interessado: "Interessado", confirmado: "Confirmado", compareceu: "Compareceu", cancelado: "Cancelado",
};

export type CrmEvent = { id: string; event_title: string | null; date: string | null };
export type CrmNotification = { id: string; title: string; message: string; event_id: string | null; created_at: string };
export type CrmDelivery = { id: string; notification_id: string; subscriber_id: string; delivered_at: string | null };
export type SubscriberPatch = { name?: string | null; email?: string; phone?: string | null; neighborhood?: string | null; interest_event_id?: string | null; interest_status?: InterestStatus };

const crmKeys = { events: ["crm", "events"] as const, notifications: ["crm", "notifications"] as const, deliveries: ["crm", "deliveries"] as const };

/** Rolês aprovados para vincular interesse de inscritos. */
export function useCrmEvents() {
  return useQuery({ queryKey: crmKeys.events, staleTime: 60_000, queryFn: async (): Promise<CrmEvent[]> => {
    const { data, error } = await supabase.from("submissions").select("id, event_title, date").eq("status", "approved").is("deleted_at", null).order("date", { ascending: false }).limit(300);
    if (error) throw error;
    return (data ?? []) as CrmEvent[];
  } });
}

export function useUpdateSubscriber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: SubscriberPatch }) => {
      const { error } = await supabase.from("newsletter_subscribers").update(patch).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: qk.newsletter.list() });
      const prev = qc.getQueryData(qk.newsletter.list());
      qc.setQueryData(qk.newsletter.list(), (rows: Array<{ id: string }> | undefined) => rows?.map(r => (r.id === id ? { ...r, ...patch } : r)));
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(qk.newsletter.list(), ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: qk.newsletter.all }),
  });
}

export function useCrmNotifications() {
  return useQuery({ queryKey: crmKeys.notifications, queryFn: async (): Promise<CrmNotification[]> => {
    const { data, error } = await supabase.from("crm_notifications").select("id, title, message, event_id, created_at").order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as CrmNotification[];
  } });
}

export function useCrmDeliveries() {
  return useQuery({ queryKey: crmKeys.deliveries, queryFn: async (): Promise<CrmDelivery[]> => {
    const { data, error } = await supabase.from("crm_notification_deliveries").select("id, notification_id, subscriber_id, delivered_at");
    if (error) throw error;
    return (data ?? []) as CrmDelivery[];
  } });
}

/** Registra um aviso e cria a lista de destinatários como pendentes. */
export function useCreateCrmNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ title, message, event_id, subscriberIds }: { title: string; message: string; event_id: string | null; subscriberIds: string[] }) => {
      const { data: auth } = await supabase.auth.getUser();
      const { data, error } = await supabase.from("crm_notifications").insert({ title, message, event_id, created_by: auth.user?.id ?? null }).select("id").single();
      if (error) throw error;
      if (subscriberIds.length) {
        const { error: e2 } = await supabase.from("crm_notification_deliveries").insert(subscriberIds.map(subscriber_id => ({ notification_id: data.id, subscriber_id })));
        if (e2) throw e2;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm"] }),
  });
}

export function useSetDelivered() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, delivered }: { id: string; delivered: boolean }) => {
      const { error } = await supabase.from("crm_notification_deliveries").update({ delivered_at: delivered ? new Date().toISOString() : null }).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, delivered }) => {
      await qc.cancelQueries({ queryKey: crmKeys.deliveries });
      const prev = qc.getQueryData<CrmDelivery[]>(crmKeys.deliveries);
      qc.setQueryData<CrmDelivery[]>(crmKeys.deliveries, rows => rows?.map(r => (r.id === id ? { ...r, delivered_at: delivered ? new Date().toISOString() : null } : r)));
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(crmKeys.deliveries, ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: crmKeys.deliveries }),
  });
}
