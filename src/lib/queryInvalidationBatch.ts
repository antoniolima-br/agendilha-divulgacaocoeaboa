/** One timer per batch, retaining every affected query family during bursts. */
export function createQueryInvalidationBatch(invalidate: (key: readonly unknown[]) => void, delay = 750) {
  const keys = new Map<string, readonly unknown[]>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    schedule(key: readonly unknown[]) {
      keys.set(JSON.stringify(key), key);
      clearTimeout(timer);
      timer = setTimeout(() => {
        const affected = [...keys.values()];
        keys.clear();
        timer = undefined;
        affected.forEach(invalidate);
      }, delay);
    },
    cancel() {
      clearTimeout(timer);
      keys.clear();
    },
  };
}