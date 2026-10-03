export type EventStartSlot = {
  date?: string | null;
  startTime?: string | null;
};

const normalizeDate = (value?: string | null) => value?.trim().slice(0, 10) ?? "";
const normalizeTime = (value?: string | null) => value?.trim().slice(0, 5) ?? "";

export function findDuplicateEventStart(slots: EventStartSlot[]): number[] {
  const firstIndexBySlot = new Map<string, number>();
  const duplicates = new Set<number>();

  slots.forEach((slot, index) => {
    const date = normalizeDate(slot.date);
    const startTime = normalizeTime(slot.startTime);
    if (!date || !startTime) return;

    const key = `${date}|${startTime}`;
    const firstIndex = firstIndexBySlot.get(key);
    if (firstIndex === undefined) {
      firstIndexBySlot.set(key, index);
      return;
    }

    duplicates.add(firstIndex);
    duplicates.add(index);
  });

  return [...duplicates].sort((a, b) => a - b);
}