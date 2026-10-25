import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { APP_SETTINGS_KEY, useAppSettings } from "@/data/useAppSettings";
import { HOME_VIDEO_BUCKET, HOME_VIDEO_KEYS, STORAGE_PREFIX, isStoredFile, openingVideo } from "@/lib/homeVideo";
import { Button } from "@/components/ui/button";

const MAX_MB = 50;
type Msg = { ok: boolean; text: string } | null;

/** Até três vídeos de abertura (só diretoria; o backend confere de novo). */
export function CurationVideoTest() {
  const { data } = useAppSettings();
  return (
    <section className="mb-6 rounded-2xl border p-4">
      <h2 className="text-lg font-semibold">Vídeos de abertura (teste)</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Até 3 vídeos de {MAX_MB} MB. Eles tocam um depois do outro quando o app abre, na ordem 1, 2, 3.
      </p>
      <ul className="grid gap-3 sm:grid-cols-3">
        {HOME_VIDEO_KEYS.map((key, i) => (
          <VideoSlot key={key} slot={i + 1} value={(data?.[key] ?? "").trim()} />
        ))}
      </ul>
    </section>
  );
}

function VideoSlot({ slot, value }: { slot: number; value: string }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  const save = async (url: string, okText: string) => {
    const { error } = await supabase.rpc("set_home_video_slot", { p_slot: slot, p_url: url });
    if (error) throw error;
    openingVideo.reset();
    await qc.invalidateQueries({ queryKey: APP_SETTINGS_KEY });
    setMsg({ ok: true, text: okText });
  };

  const removeOld = async () => {
    if (isStoredFile(value)) await supabase.storage.from(HOME_VIDEO_BUCKET).remove([value.slice(STORAGE_PREFIX.length)]);
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    setMsg(null);
    if (!file.type.startsWith("video/")) return setMsg({ ok: false, text: "Escolha um arquivo de vídeo." });
    if (file.size > MAX_MB * 1024 * 1024) return setMsg({ ok: false, text: `Passa de ${MAX_MB} MB. Tente um mais curto.` });
    setBusy(true);
    try {
      const ext = (file.name.split(".").pop() ?? "mp4").toLowerCase().replace(/[^a-z0-9]/g, "") || "mp4";
      const path = `video/${slot}-${Date.now()}.${ext}`;
      const up = await supabase.storage.from(HOME_VIDEO_BUCKET).upload(path, file, { contentType: file.type });
      if (up.error) throw up.error;
      const old = value;
      await save(`${STORAGE_PREFIX}${path}`, "Vídeo salvo!");
      if (old) await removeOldValue(old);
    } catch (e) {
      setMsg({ ok: false, text: `Não deu pra salvar: ${(e as Error).message}` });
    } finally { setBusy(false); }
  };

  const onDelete = async () => {
    if (!window.confirm(`Tirar o Vídeo ${slot} da abertura?`)) return;
    setBusy(true); setMsg(null);
    try { await save("", "Vídeo tirado."); await removeOld(); }
    catch (e) { setMsg({ ok: false, text: `Não deu pra tirar: ${(e as Error).message}` }); }
    finally { setBusy(false); }
  };

  return (
    <li className="flex flex-col gap-2 rounded-xl border bg-card/50 p-3">
      <p className="font-semibold">Vídeo {slot}</p>
      <p className="text-xs text-muted-foreground">{value ? (isStoredFile(value) ? "Arquivo enviado" : "Link salvo") : "Vazio"}</p>
      <Button asChild disabled={busy} size="sm" className="h-11">
        <label className="cursor-pointer">
          <Upload className="mr-2 h-4 w-4" />{busy ? "Enviando…" : value ? "Trocar vídeo" : "Enviar vídeo"}
          <input type="file" accept="video/*" className="sr-only" disabled={busy}
            onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
      </Button>
      {value && (
        <Button variant="outline" size="sm" className="h-11" disabled={busy} onClick={() => void onDelete()}>
          <Trash2 className="mr-2 h-4 w-4" />Excluir
        </Button>
      )}
      {msg && (
        <p role="status" className={`flex items-center gap-1 text-xs ${msg.ok ? "text-foreground" : "text-destructive"}`}>
          {msg.ok && <CheckCircle2 className="h-4 w-4 text-primary" />}{msg.text}
        </p>
      )}
    </li>
  );
}

async function removeOldValue(old: string) {
  if (isStoredFile(old)) await supabase.storage.from(HOME_VIDEO_BUCKET).remove([old.slice(STORAGE_PREFIX.length)]);
}
