import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { qk } from '@/data/queryKeys';
import type { SectorKpiData, KpiKey } from '@/lib/sectorKpis';

export function useSectorKpis(month: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: qk.intranet.records(user?.id ?? null, `kpis-${month}`), enabled: !!user,
    staleTime: 0, refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('intranet_sector_kpis', { p_month: `${month}-01` });
      if (error) throw error;
      return data as unknown as SectorKpiData;
    },
  });
}
export function useSaveKpiTargets() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ month, targets }: { month: string; targets: Record<KpiKey, number | null> }) => {
      const { error } = await supabase.rpc('intranet_save_kpi_targets', { p_month: `${month}-01`, p_targets: targets });
      if (error) throw error;
      const { data, error: readError } = await supabase.rpc('intranet_sector_kpis', { p_month: `${month}-01` });
      if (readError) throw readError;
      const actual = data as unknown as SectorKpiData;
      if (!actual.metrics.every(row => row.target === targets[row.key])) throw new Error('Metas não confirmadas');
    },
    onSuccess: () => client.invalidateQueries({ queryKey: qk.intranet.all }),
  });
}