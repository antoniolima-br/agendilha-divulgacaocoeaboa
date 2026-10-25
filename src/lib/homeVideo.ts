export type HomeVideoSource =
  | { kind: "youtube"; embed: string }
  | { kind: "vimeo"; embed: string }
  | { kind: "file"; src: string }
  | null;

/** Converte o link salvo pela diretoria num formato que a Home sabe tocar (sempre mudo no início). */
export function parseHomeVideo(raw: string | null | undefined): HomeVideoSource {
  const url = (raw ?? "").trim();
  if (!/^https:\/\//i.test(url)) return null;
  let parsed: URL;
  try { parsed = new URL(url); } catch { return null; }
  const host = parsed.hostname.replace(/^www\.|^m\./, "");
  const params = "autoplay=1&mute=1&playsinline=1&loop=1&controls=1&rel=0";
  if (host === "youtu.be" || host.endsWith("youtube.com")) {
    const id = host === "youtu.be"
      ? parsed.pathname.slice(1)
      : parsed.searchParams.get("v") ?? parsed.pathname.match(/\/(?:shorts|embed|live)\/([\w-]+)/)?.[1];
    if (!id || !/^[\w-]{6,20}$/.test(id)) return null;
    return { kind: "youtube", embed: `https://www.youtube-nocookie.com/embed/${id}?${params}&playlist=${id}` };
  }
  if (host.endsWith("vimeo.com")) {
    const id = parsed.pathname.match(/(\d{5,})/)?.[1];
    if (!id) return null;
    return { kind: "vimeo", embed: `https://player.vimeo.com/video/${id}?autoplay=1&muted=1&loop=1&playsinline=1` };
  }
  if (/\.(mp4|webm|mov)(\?|$)/i.test(parsed.pathname + parsed.search)) return { kind: "file", src: url };
  return null;
}
