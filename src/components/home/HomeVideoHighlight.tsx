import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX, X } from "lucide-react";
import { useAppSettings } from "@/data/useAppSettings";
import { openingVideo, parseHomeVideo, useResolvedMediaUrl } from "@/lib/homeVideo";
import logo from "@/assets/coeaboa-logo.webp";

/**
 * Vídeo de abertura: toca uma vez quando o app é aberto ou atualizado.
 * Quando termina ou a pessoa pula, dá lugar à capa estática (também nas navegações seguintes).
 */
export function HomeVideoHighlight({ placePhrase = "no Rio" }: { placePhrase?: string }) {
  const { data } = useAppSettings();
  const source = parseHomeVideo(data?.home_video_url);
  const { data: fileSrc } = useResolvedMediaUrl(source?.kind === "file" ? source.src : "");
  const { data: cover } = useResolvedMediaUrl(data?.home_video_cover_url);
  const title = (data?.home_video_title ?? "").trim() || `O que tá rolando ${placePhrase}`;
  const [showVideo, setShowVideo] = useState(openingVideo.shouldPlay);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const finish = () => { openingVideo.markDone(); setShowVideo(false); setReady(false); };
  const playing = showVideo && !!source && (source.kind !== "file" || !!fileSrc);

  // Saiu da Home durante o vídeo: conta como já visto.
  useEffect(() => () => { if (source) openingVideo.markDone(); }, [source]);

  const togglePlay = () => {
    const v = videoRef.current; if (!v) return;
    if (v.paused) { void v.play(); setPaused(false); } else { v.pause(); setPaused(true); }
  };
  const btn = "flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow";

  return (
    <section aria-label="Vídeo em destaque" className="mx-auto w-full max-w-screen-lg px-3 pt-2 sm:px-6">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-primary/30 bg-secondary shadow-lg">
        <div className={`absolute inset-0 transition-opacity duration-500 ${playing && ready ? "opacity-0" : "opacity-100"}`}>
          {cover && /^https:\/\//i.test(cover) ? (
            <img src={cover} alt="" className="h-full w-full object-cover" loading="eager" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary via-background to-primary/30">
              <img src={logo} alt="" className="h-20 w-20 rounded-2xl opacity-90 sm:h-28 sm:w-28" />
            </div>
          )}
        </div>

        {playing && source.kind === "file" && (
          <video ref={videoRef} src={fileSrc} autoPlay muted={muted} playsInline preload="auto"
            onCanPlay={() => setReady(true)} onEnded={finish} onError={finish}
            className="absolute inset-0 h-full w-full object-cover" />
        )}
        {playing && source.kind !== "file" && (
          <iframe src={source.embed} title={title} onLoad={() => setReady(true)}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen
            className="absolute inset-0 h-full w-full border-0" />
        )}

        {playing && (
          <button type="button" onClick={finish} aria-label="Pular vídeo"
            className="absolute right-2 top-2 z-10 flex h-11 items-center gap-1 rounded-full bg-background/85 px-4 text-sm font-bold text-foreground shadow">
            Pular <X className="h-4 w-4" />
          </button>
        )}

        {(!playing || source.kind === "file") && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-background/90 to-transparent p-3 sm:p-4">
            <p className="font-display text-base font-bold leading-tight text-foreground sm:text-xl">{title}</p>
            {playing && ready && (
              <div className="pointer-events-auto flex gap-2">
                <button type="button" onClick={togglePlay} aria-label={paused ? "Tocar vídeo" : "Pausar vídeo"} className={btn}>
                  {paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                </button>
                <button type="button" onClick={() => setMuted((m) => !m)} aria-label={muted ? "Ligar som" : "Desligar som"} className={btn}>
                  {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
