import { moneyBR, parseFinanceAmount } from './finance';

export const KPI_DEFINITIONS = [
  { key: 'leads', sector: 'comercial', label: 'Novos contatos comerciais', unit: 'count', direction: 'up' },
  { key: 'sales', sector: 'comercial', label: 'Vendas com pagamento confirmado', unit: 'count', direction: 'up' },
  { key: 'registrations', sector: 'marketing', label: 'Novos cadastros', unit: 'count', direction: 'up' },
  { key: 'campaign_opens', sector: 'marketing', label: 'Aberturas de campanhas', unit: 'count', direction: 'up' },
  { key: 'submissions', sector: 'administracao', label: 'Envios recebidos', unit: 'count', direction: 'up' },
  { key: 'decisions', sector: 'administracao', label: 'Decisões de curadoria', unit: 'count', direction: 'up' },
  { key: 'revenue', sector: 'financeiro', label: 'Receita recebida', unit: 'money', direction: 'up' },
  { key: 'expenses', sector: 'financeiro', label: 'Despesas pagas', unit: 'money', direction: 'down' },
  { key: 'latency', sector: 'desenvolvimento', label: 'Latência média · medições manuais', unit: 'ms', direction: 'down' },
  { key: 'probes', sector: 'desenvolvimento', label: 'Medições registradas', unit: 'count', direction: 'up' },
] as const;
export type KpiDefinition = typeof KPI_DEFINITIONS[number];
export type KpiKey = KpiDefinition['key'];
export type SectorKpi = { key: KpiKey; current: number | null; previous: number | null; target: number | null };
export type SectorKpiData = { month: string; through: string; previous_from: string; previous_through: string; as_of: string; metrics: SectorKpi[] };
const numberBR = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
export function formatKpi(value: number | null, unit: KpiDefinition['unit']) {
  if (value === null) return 'Sem medição';
  return unit === 'money' ? moneyBR(value) : `${numberBR.format(value)}${unit === 'ms' ? ' ms' : ''}`;
}
export function monthlyChange(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous === 0) return current === 0 && previous === 0 ? 0 : null;
  return (current - previous) / Math.abs(previous) * 100;
}
export function kpiProgress(row: SectorKpi, direction: KpiDefinition['direction']) {
  if (row.current === null || row.target === null) return null;
  const met = direction === 'down' ? row.current <= row.target : row.current >= row.target;
  const ratio = direction === 'down' ? (row.current === 0 ? 1 : row.target / row.current) : (row.target === 0 ? 1 : row.current / row.target);
  return { met, value: Math.min(100, Math.max(0, ratio * 100)) };
}
export function parseKpiTarget(value: string, unit: KpiDefinition['unit']): number | null | undefined {
  if (!value.trim()) return null;
  if (unit === 'money') return parseFinanceAmount(value) ?? undefined;
  if (!(unit === 'count' ? /^\d+$/ : /^\d+(?:,\d)?$/).test(value.trim())) return undefined;
  const amount = Number(value.trim().replace(',', '.'));
  return Number.isFinite(amount) && amount <= 1_000_000_000_000 ? amount : undefined;
}