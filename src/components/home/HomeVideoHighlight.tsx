import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useAppSettings } from "@/data/useAppSettings";
import { parseHomeVideo } from "@/lib/homeVideo";
import logo from "@/assets/coeaboa-logo.webp";

/** Vídeo em destaque no topo da Home; sem link válido (ou enquanto carrega) mostra a capa estática. */
export function HomeVideoHighlight() {
  const { data } = useAppSettings();
  const source = parseHomeVideo(data?.home_video_url);
  const cover = (data?.home_video_cover_url ?? "").trim();
  const title = (data?.home_video_title ?? "").trim() || "O que tá rolando na Ilha";
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => { setReady(false); }, [data?.home_video_url]);

  const togglePlay = () => {
    const v = videoRef.current; if (!v) return;
    if (v.paused) { void v.play(); setPaused(false); } else { v.pause(); setPaused(true); }
  };

  return (
    <section aria-label="Vídeo em destaque" className="mx-auto w-full max-w-screen-lg px-3 pt-2 sm:px-6">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-primary/30 bg-secondary shadow-lg">
        {/* Capa: sempre por baixo, então a tela nunca fica em branco */}
        <div className={`absolute inset-0 transition-opacity duration-500 ${ready ? "opacity-0" : "opacity-100"}`}>
          {/^https:\/\//i.test(cover) ? (
            <img src={cover} alt="" className="h-full w-full object-cover" loading="eager" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary via-background to-primary/30">
              <img src={logo} alt="" className="h-20 w-20 rounded-2xl opacity-90 sm:h-28 sm:w-28" />
            </div>
          )}
        </div>

        {source?.kind === "file" && (
          <video ref={videoRef} src={source.src} poster={cover || undefined} autoPlay muted={muted} loop playsInline preload="metadata"
            onCanPlay={() => setReady(true)} onError={() => setReady(false)}
            className="absolute inset-0 h-full w-full object-cover" />
        )}
        {(source?.kind === "youtube" || source?.kind === "vimeo") && (
          <iframe src={source.embed} title={title} loading="lazy" onLoad={() => setReady(true)}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen
            className="absolute inset-0 h-full w-full border-0" />
        )}

        {source?.kind !== "youtube" && source?.kind !== "vimeo" && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-background/90 to-transparent p-3 sm:p-4">
            <p className="font-display text-base font-bold leading-tight text-foreground sm:text-xl">{title}</p>
            {source?.kind === "file" && ready && (
              <div className="pointer-events-auto flex gap-2">
                <button type="button" onClick={togglePlay} aria-label={paused ? "Tocar vídeo" : "Pausar vídeo"}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                  {paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                </button>
                <button type="button" onClick={() => setMuted((m) => !m)} aria-label={muted ? "Ligar som" : "Desligar som"}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
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
