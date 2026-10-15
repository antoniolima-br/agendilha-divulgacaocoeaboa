import { compressImage } from "./mediaCompression";

export async function isAnimatedWebp(file: File): Promise<boolean> {
  if (file.type !== "image/webp") return false;
  const bytes = new Uint8Array(await file.arrayBuffer());
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const name = String.fromCharCode(...bytes.subarray(offset, offset + 4));
    if (name === "ANIM" || name === "ANMF") return true;
    const size = new DataView(bytes.buffer).getUint32(offset + 4, true);
    offset += 8 + size + (size % 2);
  }
  return false;
}

/** Upload-only adapter: do not retain preview blobs, or flatten animated media. */
export async function prepareUploadImage(original: File): Promise<File> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(original.type)) return original;
  if (await isAnimatedWebp(original)) return original;
  const result = await compressImage(original);
  URL.revokeObjectURL(result.preview);
  return result.file;
}