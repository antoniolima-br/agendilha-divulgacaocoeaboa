/** Exact app-owned legacy image cache only; never touch sessions or messaging caches. */
export async function releaseLegacyFlyerCache(storage: Pick<CacheStorage, "delete">) {
  await storage.delete("app-images");
}