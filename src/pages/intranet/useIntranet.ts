import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { qk } from '@/data/queryKeys';
import { type IntranetSector, type IntranetDashboard, type IntranetBI, type Operation, type SectorAccess } from '@/lib/intranet';
import type { Tables } from '@/integrations/supabase/types';
import { fetchAllPages } from '@/data/pagination';
export type Lead = Tables<'intranet_leads'>;
export type Campaign = Tables<'intranet_campaigns'>;
export type Investment = Tables<'intranet_investments'>;
export type Sample = Tables<'intranet_health_samples'>;
export type Member = { id: string; name: string; roles: string[] };
export function useIntranet(sector: IntranetSector, days: number, enabled: boolean) {
  const { user } = useAuth();
  return useQuery({ queryKey: qk.intranet.dashboard(user?.id ?? null, sector, days), enabled: enabled && !!user, staleTime: 30_000, refetchInterval: 30_000,
    queryFn: async () => { const { data, error } = await supabase.rpc('intranet_dashboard', { p_sector: sector, p_days: days }); if (error) throw error; return data as unknown as IntranetDashboard; } });
}
export function useIntranetBI(days: number, enabled: boolean) {
  const { user } = useAuth();
  return useQuery({ queryKey: qk.intranet.dashboard(user?.id ?? null, 'bi', days), enabled: enabled && !!user, refetchInterval: 30_000,
    queryFn: async () => { const { data, error } = await supabase.rpc('intranet_bi', { p_days: days }); if (error) throw error; return data as unknown as IntranetBI; } });
}
export function useSectorAccess(enabled: boolean) {
  const { user } = useAuth();
  return useQuery({ queryKey: qk.intranet.records(user?.id ?? null, 'sector-access'), enabled: enabled && !!user, staleTime: 60_000,
    queryFn: async () => { const { data, error } = await supabase.rpc('intranet_sector_access'); if (error) throw error; return data as unknown as SectorAccess; } });
}
export function useOperations(sector: Operation['sector']) {
  const { user } = useAuth();
  return useQuery({ queryKey: qk.intranet.records(user?.id ?? null, `operations-${sector}`), enabled: !!user,
    queryFn: () => fetchAllPages<Operation>(async (from, to) => { const { data, error } = await supabase.from('intranet_operations').select('*').eq('sector', sector).order('created_at', { ascending: false }).order('id').range(from, to); return { data: data?.map(row => ({ ...row, sector })) ?? null, error }; }) });
}
export function useSectorRecords<T>(table: 'intranet_leads' | 'intranet_campaigns' | 'intranet_health_samples' | 'intranet_investments') {
  const { user } = useAuth();
  return useQuery({ queryKey: qk.intranet.records(user?.id ?? null, table), enabled: !!user, queryFn: () => fetchAllPages<T>(async (from,to) => { const {data,error} = await supabase.from(table).select('*').order('created_at',{ascending:false}).order('id').range(from,to); return {data:data as T[] | null,error}; }) });
}
export function usePortalCommand() {
  const client = useQueryClient();
  return useMutation({ mutationFn: async (action: () => PromiseLike<{ error: unknown }>) => { const { error } = await action(); if (error) throw error; }, onSuccess: async () => { await Promise.all([qk.intranet.all, qk.finance.all, qk.permissions.all, qk.curation.all, qk.submissions.all, qk.home.all, qk.agenda.all, qk.adminUsers.all].map(queryKey => client.invalidateQueries({ queryKey }))); } });
}
export function useMembers(enabled: boolean) {
  const { user } = useAuth();
  return useQuery({ queryKey: qk.intranet.records(user?.id ?? null, 'members'), enabled, queryFn: async () => { const { data, error } = await supabase.rpc('intranet_members'); if (error) throw error; return data as unknown as Member[]; } });
}
