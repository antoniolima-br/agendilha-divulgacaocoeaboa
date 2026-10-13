import { describe, expect, it } from 'vitest';
import { monthlyChange, kpiProgress, parseKpiTarget, formatKpi, KPI_DEFINITIONS } from './sectorKpis';
describe('sector KPIs', () => {
  it('computes signed changes without inventing a baseline', () => {
    expect(monthlyChange(150, 100)).toBe(50);
    expect(monthlyChange(50, 100)).toBe(-50);
    expect(monthlyChange(5, 0)).toBeNull();
    expect(monthlyChange(0, 0)).toBe(0);
    expect(monthlyChange(null, 10)).toBeNull();
  });
  it('handles upper limits, zero targets and progress bounds', () => {
    expect(kpiProgress({ key: 'leads', current: 20, previous: 1, target: 10 }, 'up')).toEqual({ met: true, value: 100 });
    expect(kpiProgress({ key: 'expenses', current: 200, previous: 1, target: 100 }, 'down')).toEqual({ met: false, value: 50 });
    expect(kpiProgress({ key: 'expenses', current: 0, previous: 1, target: 0 }, 'down')).toEqual({ met: true, value: 100 });
    expect(kpiProgress({ key: 'latency', current: null, previous: null, target: 100 }, 'down')).toBeNull();
    expect(kpiProgress({ key: 'leads', current: 10, previous: 1, target: null }, 'up')).toBeNull();
  });
  it('parses optional targets and Brazilian amounts safely', () => {
    expect(parseKpiTarget('', 'count')).toBeNull();
    expect(parseKpiTarget('1.200,50', 'money')).toBe(120050);
    expect(parseKpiTarget('20,5', 'ms')).toBe(20.5);
    expect(parseKpiTarget('-1', 'count')).toBeUndefined();
    expect(parseKpiTarget('1,5', 'count')).toBeUndefined();
    expect(formatKpi(null, 'ms')).toBe('Sem medição');
    expect(new Set(KPI_DEFINITIONS.map(row => row.sector)).size).toBe(5);
  });
});