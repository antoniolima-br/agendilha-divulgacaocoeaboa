import { useEffect, useRef, useState } from "react";
import { Pause, Play, SkipForward, Volume2, VolumeX, X } from "lucide-react";
import { useAppSettings } from "@/data/useAppSettings";
import { homeVideoPlaylist, openingVideo, parseHomeVideo, useResolvedMediaUrl } from "@/lib/homeVideo";
import logo from "@/assets/coeaboa-logo.webp";

/**
 * Abertura: toca até três vídeos em sequência, uma vez por abertura/atualização do app.
 * Ao terminar o último (ou pular), dá lugar à capa estática.
 */
export function HomeVideoHighlight({ placePhrase = "no Rio" }: { placePhrase?: string }) {
  const { data } = useAppSettings();
  const playlist = homeVideoPlaylist(data);
  const { data: cover } = useResolvedMediaUrl(data?.home_video_cover_url);
  const title = (data?.home_video_title ?? "").trim() || `O que tá rolando ${placePhrase}`;
  const [showVideo, setShowVideo] = useState(openingVideo.shouldPlay);
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);

  const finish = () => { openingVideo.markDone(); setShowVideo(false); setReady(false); };
  const next = () => {
    setReady(false);
    if (index + 1 < playlist.length) setIndex(index + 1); else finish();
  };
  const current = playlist[index];
  const playing = showVideo && !!current;

  useEffect(() => () => { if (playlist.length) openingVideo.markDone(); }, [playlist.length]);

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

        {playing && (
          <div key={`${index}-${current}`} className={`absolute inset-0 transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`}>
            <OpeningClip raw={current} title={title} onReady={() => setReady(true)} onEnd={next} />
          </div>
        )}

        {playing && (
          <div className="absolute right-1.5 top-1.5 z-10 flex items-center gap-1">
            {playlist.length > 1 && (
              <span className="flex h-6 items-center rounded-full bg-background/70 px-2 text-[10px] font-semibold leading-none backdrop-blur-sm text-foreground shadow" aria-live="polite">
                {index + 1}/{playlist.length}
              </span>
            )}
            {index + 1 < playlist.length && (
              <button type="button" onClick={next} aria-label="Próximo vídeo"
                className="!min-h-0 flex h-6 items-center gap-0.5 rounded-full bg-background/70 px-2 text-[10px] font-semibold leading-none text-foreground backdrop-blur-sm">
                Próximo <SkipForward className="h-3 w-3" />
              </button>
            )}
            <button type="button" onClick={finish} aria-label="Pular vídeos"
              className="!min-h-0 flex h-6 items-center gap-0.5 rounded-full bg-background/70 px-2 text-[10px] font-semibold leading-none text-foreground backdrop-blur-sm">
              Pular <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {!playing && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-3 sm:p-4">
            <p className="font-display text-base font-bold leading-tight text-foreground sm:text-xl">{title}</p>
          </div>
        )}
      </div>
    </section>
  );
}

function OpeningClip({ raw, title, onReady, onEnd }: { raw: string; title: string; onReady: () => void; onEnd: () => void }) {
  const source = parseHomeVideo(raw);
  const { data: fileSrc, isError } = useResolvedMediaUrl(source?.kind === "file" ? source.src : "");
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => { if (isError) onEnd(); }, [isError]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!source) return null;
  const btn = "!min-h-0 flex h-7 w-7 items-center justify-center rounded-full bg-background/70 text-foreground backdrop-blur-sm";

  if (source.kind !== "file") {
    return <iframe src={source.embed} title={title} onLoad={onReady}
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen className="h-full w-full border-0" />;
  }
  if (!fileSrc) return null;
  const toggle = () => { const v = ref.current; if (!v) return; if (v.paused) { void v.play(); setPaused(false); } else { v.pause(); setPaused(true); } };
  return (
    <>
      <video ref={ref} src={fileSrc} autoPlay muted={muted} playsInline preload="auto"
        onCanPlay={onReady} onEnded={onEnd} onError={onEnd} className="h-full w-full object-cover" />
      <div className="absolute bottom-1.5 right-1.5 flex gap-1">
        <button type="button" onClick={toggle} aria-label={paused ? "Tocar vídeo" : "Pausar vídeo"} className={btn}>
          {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
        </button>
        <button type="button" onClick={() => setMuted((m) => !m)} aria-label={muted ? "Ligar som" : "Desligar som"} className={btn}>
          {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        </button>
      </div>
    </>
  );
}
