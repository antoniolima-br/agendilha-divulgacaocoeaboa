import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "./mediaCompression";
import { prepareUploadImage, isAnimatedWebp } from "./uploadImage";

/** Only our paired uploads carry this marker; legacy/external art is untouched. */
export function flyerListingUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  return url.replace(/\.flyer\.(webp|jpe?g|png)(?=[?#]|$)/i, ".thumb.webp");
}

export async function uploadFlyerImage(file: File, path: string): Promise<string> {
  const bucket = supabase.storage.from("event-flyers");
  const prepared = await prepareUploadImage(file);
  const base = path.replace(/\.[^./]+$/, "");
  let thumbnail: File | undefined;
  if (["image/jpeg", "image/png", "image/webp"].includes(prepared.type) && !(await isAnimatedWebp(prepared))) {
    const result = await compressImage(prepared, { maxSide: 480, quality: 0.72, outputType: "image/webp" });
    URL.revokeObjectURL(result.preview);
    if (result.file.type === "image/webp") thumbnail = result.file;
  }
  // Publish a paired URL only after the lightweight file actually exists.
  let thumbnailPath: string | undefined;
  if (thumbnail) {
    const nextPath = `${base}.thumb.webp`;
    const { error } = await bucket.upload(nextPath, thumbnail, { contentType: thumbnail.type, upsert: false });
    if (error) throw error;
    thumbnailPath = nextPath;
  }
  const extension = prepared.name.split(".").pop() || "jpg";
  // Listing pairing is case-insensitive; normalize persisted paths for predictable cache keys.
  const officialPath = thumbnailPath ? `${base}.flyer.${extension.toLowerCase()}` : path;
  const { error } = await bucket.upload(officialPath, prepared, { contentType: prepared.type, upsert: false });
  if (error) {
    if (thumbnailPath) await bucket.remove([thumbnailPath]);
    throw error;
  }
  return bucket.getPublicUrl(officialPath).data.publicUrl;
}