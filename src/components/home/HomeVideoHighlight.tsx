import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, SkipForward, Volume2, VolumeX, X } from "lucide-react";
import { useAppSettings } from "@/data/useAppSettings";
import { homeVideoPlaylist, openingVideo, parseHomeVideo, useResolvedMediaUrl } from "@/lib/homeVideo";
import logo from "@/assets/coeaboa-logo.webp";

const pill = "!min-h-0 flex h-5 items-center gap-0.5 rounded-full bg-background/60 px-1.5 text-[9px] font-semibold leading-none text-foreground backdrop-blur-sm";
const iconBtn = "!min-h-0 flex h-6 w-6 items-center justify-center rounded-full bg-background/60 text-foreground backdrop-blur-sm";

/**
 * Abertura: toca até três vídeos em sequência, uma vez por abertura do app.
 * O som começa ligado e a escolha vale para os vídeos seguintes.
 * Ao terminar, mostra a imagem do primeiro vídeo com "Reproduzir novamente".
 */
export function HomeVideoHighlight(_props: { placePhrase?: string }) {
  const { data } = useAppSettings();
  const rawList = homeVideoPlaylist(data);
  const playlist = Array.isArray(rawList) ? rawList.filter((v): v is string => typeof v === "string" && v.trim().length > 0) : [];
  const { data: cover } = useResolvedMediaUrl(data?.home_video_cover_url ?? "");
  const firstSource = playlist.length > 0 ? parseHomeVideo(playlist[0]) : null;
  const { data: firstFile } = useResolvedMediaUrl(firstSource?.kind === "file" ? firstSource.src : "");
  const [showVideo, setShowVideo] = useState<boolean>(() => { try { return Boolean(openingVideo.shouldPlay()); } catch { return false; } });
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(false);

  const safeIndex = index >= 0 && index < playlist.length ? index : 0;
  const current = playlist[safeIndex];
  const playing = showVideo && typeof current === "string";

  const finish = () => { openingVideo.markDone(); setShowVideo(false); setReady(false); setIndex(0); };
  const next = () => {
    setReady(false);
    if (safeIndex + 1 < playlist.length) setIndex(safeIndex + 1); else finish();
  };
  const replay = () => { setIndex(0); setReady(false); setShowVideo(true); };

  useEffect(() => () => { if (playlist.length) openingVideo.markDone(); }, [playlist.length]);

  const coverOk = typeof cover === "string" && /^https:\/\//i.test(cover);
  const firstFrame = typeof firstFile === "string" && firstFile ? `${firstFile}#t=0.1` : "";

  return (
    <section aria-label="Vídeo em destaque" className="mx-auto w-full max-w-screen-lg px-3 pt-2 sm:px-6">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-primary/30 bg-secondary shadow-lg">
        <div className={`absolute inset-0 transition-opacity duration-500 ${playing && ready ? "opacity-0" : "opacity-100"}`}>
          {firstFrame ? (
            <video src={firstFrame} muted playsInline preload="metadata" aria-hidden className="h-full w-full object-cover" />
          ) : coverOk ? (
            <img src={cover} alt="" className="h-full w-full object-cover" loading="eager" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary via-background to-primary/30">
              <img src={logo} alt="" className="h-20 w-20 rounded-2xl opacity-90 sm:h-28 sm:w-28" />
            </div>
          )}
        </div>

        {playing && (
          <div key={`${safeIndex}-${current}`} className={`absolute inset-0 transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`}>
            <OpeningClip raw={current} muted={muted} onMutedChange={setMuted} onReady={() => setReady(true)} onEnd={next} />
          </div>
        )}

        {playing && (
          <div className="absolute right-1 top-1 z-10 flex items-center gap-1">
            {playlist.length > 1 && (
              <span className={pill} aria-live="polite">{safeIndex + 1}/{playlist.length}</span>
            )}
            {safeIndex + 1 < playlist.length && (
              <button type="button" onClick={next} aria-label="Próximo vídeo" className={pill}>
                Próximo <SkipForward className="h-2.5 w-2.5" />
              </button>
            )}
            <button type="button" onClick={finish} aria-label="Pular vídeos" className={pill}>
              Pular <X className="h-2.5 w-2.5" />
            </button>
          </div>
        )}

        {!playing && playlist.length > 0 && (
          <button type="button" onClick={replay} aria-label="Reproduzir novamente"
            className={`${pill} absolute bottom-1 right-1 z-10`}>
            <RotateCcw className="h-2.5 w-2.5" /> Reproduzir novamente
          </button>
        )}
      </div>
    </section>
  );
}

function OpeningClip({ raw, muted, onMutedChange, onReady, onEnd }: {
  raw: string; muted: boolean; onMutedChange: (m: boolean) => void; onReady: () => void; onEnd: () => void;
}) {
  const source = typeof raw === "string" ? parseHomeVideo(raw) : null;
  const { data: fileSrc, isError } = useResolvedMediaUrl(source?.kind === "file" ? source.src : "");
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => { if (isError || !source) onEnd(); }, [isError, source]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tenta tocar com som; se o navegador bloquear, segue sem som.
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = muted;
    const p = v.play?.();
    if (p && typeof p.catch === "function") {
      p.catch(() => {
        if (!v.muted) { v.muted = true; onMutedChange(true); void v.play?.()?.catch?.(() => undefined); }
      });
    }
  }, [fileSrc]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (ref.current) ref.current.muted = muted; }, [muted]);

  if (!source) return null;

  if (source.kind !== "file") {
    const embed = typeof source.embed === "string" ? source.embed : "";
    if (!embed) return null;
    let src = embed;
    try {
      const u = new URL(embed);
      u.searchParams.set("mute", muted ? "1" : "0");
      u.searchParams.set("muted", muted ? "1" : "0");
      src = u.toString();
    } catch { /* mantém o link original */ }
    return <iframe src={src} title="Vídeo de abertura" onLoad={onReady}
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen className="h-full w-full border-0" />;
  }
  if (typeof fileSrc !== "string" || !fileSrc) return null;
  const toggle = () => { const v = ref.current; if (!v) return; if (v.paused) { void v.play?.()?.catch?.(() => undefined); setPaused(false); } else { v.pause(); setPaused(true); } };
  return (
    <>
      <video ref={ref} src={fileSrc} autoPlay playsInline preload="auto"
        onCanPlay={onReady} onEnded={onEnd} onError={onEnd} className="h-full w-full object-cover" />
      <div className="absolute bottom-1 right-1 flex gap-1">
        <button type="button" onClick={toggle} aria-label={paused ? "Tocar vídeo" : "Pausar vídeo"} className={iconBtn}>
          {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
        </button>
        <button type="button" onClick={() => onMutedChange(!muted)} aria-label={muted ? "Ligar som" : "Desligar som"} className={iconBtn}>
          {muted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
        </button>
      </div>
    </>
  );
}
