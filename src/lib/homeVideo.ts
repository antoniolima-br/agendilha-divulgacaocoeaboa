import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type HomeVideoSource =
  | { kind: "youtube"; embed: string }
  | { kind: "vimeo"; embed: string }
  | { kind: "file"; src: string }
  | null;

export const HOME_VIDEO_BUCKET = "home-videos";
export const STORAGE_PREFIX = "storage:";

/** Arquivos enviados pela gestão ficam guardados como "storage:caminho". */
export function isStoredFile(raw: string | null | undefined) {
  return (raw ?? "").trim().startsWith(STORAGE_PREFIX);
}

/** Converte o link salvo pela diretoria num formato que a Home sabe tocar (sempre mudo no início). */
export function parseHomeVideo(raw: string | null | undefined): HomeVideoSource {
  const url = (raw ?? "").trim();
  if (isStoredFile(url)) return { kind: "file", src: url };
  if (!/^https:\/\//i.test(url)) return null;
  let parsed: URL;
  try { parsed = new URL(url); } catch { return null; }
  const host = parsed.hostname.replace(/^www\.|^m\./, "");
  if (host === "youtu.be" || host.endsWith("youtube.com")) {
    const id = host === "youtu.be"
      ? parsed.pathname.slice(1)
      : parsed.searchParams.get("v") ?? parsed.pathname.match(/\/(?:shorts|embed|live)\/([\w-]+)/)?.[1];
    if (!id || !/^[\w-]{6,20}$/.test(id)) return null;
    return { kind: "youtube", embed: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&playsinline=1&controls=1&rel=0` };
  }
  if (host.endsWith("vimeo.com")) {
    const id = parsed.pathname.match(/(\d{5,})/)?.[1];
    if (!id) return null;
    return { kind: "vimeo", embed: `https://player.vimeo.com/video/${id}?autoplay=1&muted=1&playsinline=1` };
  }
  if (/\.(mp4|webm|mov)(\?|$)/i.test(parsed.pathname + parsed.search)) return { kind: "file", src: url };
  return null;
}

/** Troca "storage:caminho" por um endereço temporário que dá pra tocar; links comuns passam direto. */
export function useResolvedMediaUrl(raw: string | null | undefined) {
  const value = (raw ?? "").trim();
  return useQuery({
    queryKey: ["home-video-media", value],
    enabled: value !== "",
    staleTime: 30 * 60_000,
    queryFn: async () => {
      if (!isStoredFile(value)) return value;
      const { data, error } = await supabase.storage.from(HOME_VIDEO_BUCKET)
        .createSignedUrl(value.slice(STORAGE_PREFIX.length), 60 * 60 * 6);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}

/** O vídeo de abertura toca uma vez por carregamento do app; navegar dentro do app não traz de volta. */
let openingVideoDone = false;
export const openingVideo = {
  shouldPlay: () => !openingVideoDone,
  markDone: () => { openingVideoDone = true; },
  reset: () => { openingVideoDone = false; },
};
