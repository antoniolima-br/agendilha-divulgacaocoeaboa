import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { APP_SETTINGS_KEY, useAppSettings } from "@/data/useAppSettings";
import { HOME_VIDEO_BUCKET, STORAGE_PREFIX, openingVideo } from "@/lib/homeVideo";
import { Button } from "@/components/ui/button";

const MAX_MB = 50;

/** Envio rápido do vídeo de abertura pela Curadoria (só diretoria; o backend confere de novo). */
export function CurationVideoTest() {
  const { data } = useAppSettings();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const onFile = async (file?: File) => {
    if (!file) return;
    setMsg(null);
    if (!file.type.startsWith("video/")) return setMsg({ ok: false, text: "Escolha um arquivo de vídeo." });
    if (file.size > MAX_MB * 1024 * 1024) return setMsg({ ok: false, text: `O vídeo passa de ${MAX_MB} MB. Tente um mais curto.` });
    setBusy(true);
    try {
      const ext = (file.name.split(".").pop() ?? "mp4").toLowerCase().replace(/[^a-z0-9]/g, "") || "mp4";
      const path = `video/${Date.now()}.${ext}`;
      const up = await supabase.storage.from(HOME_VIDEO_BUCKET).upload(path, file, { contentType: file.type });
      if (up.error) throw up.error;
      const { error } = await supabase.rpc("set_home_video", {
        p_url: `${STORAGE_PREFIX}${path}`,
        p_cover: data?.home_video_cover_url ?? "",
        p_title: data?.home_video_title ?? "",
      });
      if (error) throw error;
      openingVideo.reset();
      await qc.invalidateQueries({ queryKey: APP_SETTINGS_KEY });
      setMsg({ ok: true, text: "Vídeo salvo! Ele já aparece na abertura da Home." });
    } catch (e) {
      setMsg({ ok: false, text: `Não deu pra salvar: ${(e as Error).message}` });
    } finally { setBusy(false); }
  };

  return (
    <section className="mb-6 rounded-2xl border p-4">
      <h2 className="text-lg font-semibold">Vídeo de abertura (teste)</h2>
      <p className="mb-3 text-sm text-muted-foreground">Envie um vídeo curto, de até {MAX_MB} MB. Ele toca uma vez quando o app abre.</p>
      <Button asChild disabled={busy} className="h-11">
        <label className="cursor-pointer">
          <Upload className="mr-2 h-4 w-4" />{busy ? "Enviando…" : "Enviar vídeo"}
          <input type="file" accept="video/*" className="sr-only" disabled={busy}
            onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
      </Button>
      {msg && (
        <p role="status" className={`mt-3 flex items-center gap-2 text-sm ${msg.ok ? "text-foreground" : "text-destructive"}`}>
          {msg.ok && <CheckCircle2 className="h-4 w-4 text-primary" />}{msg.text}
        </p>
      )}
    </section>
  );
}
