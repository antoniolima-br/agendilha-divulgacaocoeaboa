import { compressImage } from "./mediaCompression";

/** Upload-only adapter: do not retain preview blobs, or flatten animated media. */
export async function prepareUploadImage(original: File): Promise<File> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(original.type)) return original;
  const result = await compressImage(original);
  URL.revokeObjectURL(result.preview);
  return result.file;
}