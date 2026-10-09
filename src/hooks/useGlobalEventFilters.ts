import { useSyncExternalStore } from "react";
import { DEFAULT_EVENT_FILTERS, type PublicEventFilters } from "@/lib/publicEventFilters";
let current = { ...DEFAULT_EVENT_FILTERS };
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export const getGlobalEventFilters = () => current;
export function setGlobalEventFilters(patch: Partial<PublicEventFilters>) {
  current = { ...current, ...patch, ...(patch.region !== undefined && patch.region !== current.region && patch.neighborhood === undefined ? { neighborhood: "all" } : {}) };
  listeners.forEach((listener) => listener());
}
export function clearGlobalEventFilters() { setGlobalEventFilters(DEFAULT_EVENT_FILTERS); }
export function useGlobalEventFilters() { const filters = useSyncExternalStore(subscribe, getGlobalEventFilters, getGlobalEventFilters); return { filters, setFilters: setGlobalEventFilters, clearFilters: clearGlobalEventFilters }; }
