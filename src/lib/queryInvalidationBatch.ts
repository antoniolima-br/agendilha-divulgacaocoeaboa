/** One timer per batch, retaining every affected query family during bursts. */
export function createQueryInvalidationBatch(invalidate: (key: readonly unknown[]) => void, delay = 750, maxWait = 3_000) {
  const keys = new Map<string, readonly unknown[]>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let deadline: ReturnType<typeof setTimeout> | undefined;
  const flush = () => {
    clearTimeout(timer);
    clearTimeout(deadline);
    timer = undefined;
    deadline = undefined;
    const affected = [...keys.values()];
    keys.clear();
    affected.forEach((key) => invalidate(key));
  };
  return {
    schedule(key: readonly unknown[]) {
      keys.set(JSON.stringify(key), key);
      clearTimeout(timer);
      timer = setTimeout(flush, delay);
      deadline ??= setTimeout(flush, Math.max(delay, maxWait));
    },
    cancel() {
      clearTimeout(timer);
      clearTimeout(deadline);
      timer = undefined;
      deadline = undefined;
      keys.clear();
    },
  };
}