import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { APP_SETTINGS_KEY, useAppSettings } from "@/data/useAppSettings";
import { HOME_VIDEO_BUCKET, STORAGE_PREFIX, useResolvedMediaUrl } from "@/lib/homeVideo";
import { HOME_PUBLI_KEYS, HOME_PUBLI_LABELS } from "@/lib/homePubli";
import { Button } from "@/components/ui/button";

const MAX_MB = 10;
type Msg = { ok: boolean; text: string } | null;

/** Gerenciar Publicidade: imagens do card PUBLI da Home (só diretoria; o backend confere de novo). */
export function CurationPubliSlots() {
  const { data } = useAppSettings();
  return (
    <section className="mb-6 rounded-2xl border p-4">
      <h2 className="text-lg font-semibold">Gerenciamento de Publicidade</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Imagens JPG ou PNG de até {MAX_MB} MB. A Home mostra uma delas no card PUBLI, trocando a cada nova visita.
      </p>
      <ul className="grid gap-3 sm:grid-cols-3">
        {HOME_PUBLI_KEYS.map((key, i) => (
          <PubliSlot key={key} slot={i + 1} label={HOME_PUBLI_LABELS[i]} value={(data?.[key] ?? "").trim()} />
        ))}
      </ul>
    </section>
  );
}

function PubliSlot({ slot, label, value }: { slot: number; label: string; value: string }) {
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const { data: preview } = useResolvedMediaUrl(value);

  const save = async (url: string, okText: string) => {
    const { error } = await supabase.rpc("set_home_publi_slot", { p_slot: slot, p_url: url });
    if (error) throw error;
    await qc.invalidateQueries({ queryKey: APP_SETTINGS_KEY });
    setMsg({ ok: true, text: okText });
  };
  const removeStored = async (old: string) => {
    if (old.startsWith(STORAGE_PREFIX)) await supabase.storage.from(HOME_VIDEO_BUCKET).remove([old.slice(STORAGE_PREFIX.length)]);
  };

  const pick = (f?: File) => {
    setMsg(null);
    if (!f) return;
    if (!/^image\/(jpeg|png)$/.test(f.type)) return setMsg({ ok: false, text: "Escolha uma imagem JPG ou PNG." });
    if (f.size > MAX_MB * 1024 * 1024) return setMsg({ ok: false, text: `Passa de ${MAX_MB} MB. Mande uma mais leve.` });
    setFile(f);
  };

  const onSave = async () => {
    if (!file) return;
    setBusy(true); setMsg(null);
    try {
      const ext = file.type === "image/png" ? "png" : "jpg";
      const path = `publi/${slot}-${Date.now()}.${ext}`;
      const up = await supabase.storage.from(HOME_VIDEO_BUCKET).upload(path, file, { contentType: file.type });
      if (up.error) throw up.error;
      const old = value;
      await save(`${STORAGE_PREFIX}${path}`, "Anúncio salvo!");
      setFile(null);
      if (old) await removeStored(old);
    } catch (e) { setMsg({ ok: false, text: `Não deu pra salvar: ${(e as Error).message}` }); }
    finally { setBusy(false); }
  };

  const onDelete = async () => {
    if (!window.confirm(`Limpar o ${label}?`)) return;
    setBusy(true); setMsg(null);
    try { await save("", "Espaço limpo."); await removeStored(value); }
    catch (e) { setMsg({ ok: false, text: `Não deu pra limpar: ${(e as Error).message}` }); }
    finally { setBusy(false); }
  };

  return (
    <li className="flex flex-col gap-2 rounded-xl border bg-card/50 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold">{label}</p>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          {value ? "Salvo" : "Vazio"}
        </span>
      </div>
      {value && preview && <img src={preview} alt={label} className="aspect-video w-full rounded-lg object-cover" />}
      <Button asChild variant="outline" disabled={busy} size="sm" className="h-11">
        <label className="cursor-pointer">
          <Upload className="mr-2 h-4 w-4" /><span className="truncate">{file ? file.name : "Escolher imagem"}</span>
          <input type="file" accept="image/jpeg,image/png" className="sr-only" disabled={busy}
            onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
      </Button>
      <Button size="sm" className="h-11" disabled={busy || !file} onClick={() => void onSave()}>
        {busy ? "Salvando…" : "Salvar Anúncio"}
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
