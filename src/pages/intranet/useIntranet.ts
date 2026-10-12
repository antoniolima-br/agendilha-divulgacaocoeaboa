import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { qk } from '@/data/queryKeys';
import { type IntranetSector, type IntranetDashboard } from '@/lib/intranet';
import type { Tables } from '@/integrations/supabase/types';
import { fetchAllPages } from '@/data/pagination';
export type Lead = Tables<'intranet_leads'>;
export type Campaign = Tables<'intranet_campaigns'>;
export type Sample = Tables<'intranet_health_samples'>;
export type Member = { id: string; name: string; roles: string[] };
export function useIntranet(sector: IntranetSector, days: number, enabled: boolean) {
  const { user } = useAuth();
  return useQuery({ queryKey: qk.intranet.dashboard(user?.id ?? null, sector, days), enabled: enabled && !!user, staleTime: 30_000,
    queryFn: async () => { const { data, error } = await supabase.rpc('intranet_dashboard', { p_sector: sector, p_days: days }); if (error) throw error; return data as unknown as IntranetDashboard; } });
}
export function useSectorRecords<T>(table: 'intranet_leads' | 'intranet_campaigns' | 'intranet_health_samples') {
  const { user } = useAuth();
  return useQuery({ queryKey: qk.intranet.records(user?.id ?? null, table), enabled: !!user, queryFn: () => fetchAllPages<T>(async (from,to) => { const {data,error} = await supabase.from(table).select('*').order('created_at',{ascending:false}).order('id').range(from,to); return {data:data as T[] | null,error}; }) });
}
export function usePortalCommand() {
  const client = useQueryClient();
  return useMutation({ mutationFn: async (action: () => PromiseLike<{ error: unknown }>) => { const { error } = await action(); if (error) throw error; }, onSuccess: async () => { await Promise.all([qk.intranet.all, qk.permissions.all, qk.curation.all, qk.submissions.all, qk.home.all, qk.agenda.all, qk.adminUsers.all].map(queryKey => client.invalidateQueries({ queryKey }))); } });
}
export function useMembers(enabled: boolean) {
  const { user } = useAuth();
  return useQuery({ queryKey: qk.intranet.records(user?.id ?? null, 'members'), enabled, queryFn: async () => { const { data, error } = await supabase.rpc('intranet_members'); if (error) throw error; return data as unknown as Member[]; } });
}
