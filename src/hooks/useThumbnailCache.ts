import { useEffect, useState } from "react";
import { logger } from "@/lib/logger";
import { get, set, del, keys } from "idb-keyval";

const DB_STORE_NAME = "thumb_cache_v1";
const MAX_ENTRIES = 150; // Increased since IDB has much more space than localStorage
const TARGET_SIZE = 300;

async function buildThumbnail(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = TARGET_SIZE;
        canvas.height = TARGET_SIZE;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);
        
        // Center crop to square
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, TARGET_SIZE, TARGET_SIZE);
        
        // We use JPEG for better compression of photos
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      } catch (err) {
        logger.warn("[useThumbnailCache] falha ao gerar thumbnail", err);
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

async function manageCacheLimit() {
  try {
    const allKeys = await keys();
    if (allKeys.length > MAX_ENTRIES) {
      // Remove oldest 20 entries if limit reached
      const keysToRemove = allKeys.slice(0, 20);
      await Promise.all(keysToRemove.map(k => del(k)));
    }
  } catch (err) {
    logger.warn("[useThumbnailCache] falha ao limpar cache local", err);
  }
}

/**
 * Returns a cached 300x300 thumbnail dataURL for the given image URL.
 * Falls back to the original URL while building / on failure.
 * Uses IndexedDB for storage to avoid localStorage size limits.
 */
export function useThumbnailCache(eventId: string, url?: string | null, enabled = true): string | undefined {
  const [thumb, setThumb] = useState<{ url: string; value: string } | undefined>(undefined);

  useEffect(() => {
    if (!url) {
      setThumb(undefined);
      return;
    }

    // Don't cache dataURLs (already generated fallbacks)
    if (url.startsWith("data:")) {
      setThumb({ url, value: url });
      return;
    }
    // The native lazy image must load first; never decode off-screen cards eagerly.
    if (!enabled) return;

    const key = `thumb_${eventId}_${url}`;
    let cancelled = false;

    async function init() {
      try {
        const cached = await get(key);
        if (cached && !cancelled) {
          setThumb({ url, value: cached });
          return;
        }
      } catch (err) {
        console.warn("IDB read failed, falling back to network:", err);
      }

      if (cancelled) return;
      setThumb({ url, value: url }); // Show original while building

      const data = await buildThumbnail(url);
      if (cancelled || !data) return;

      try {
        await set(key, data);
        setThumb({ url, value: data });
        await manageCacheLimit();
      } catch (err) {
        logger.warn("[useThumbnailCache] falha ao salvar no cache local", err);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [eventId, url, enabled]);

  return thumb?.url === url ? thumb?.value : url || undefined;
}
