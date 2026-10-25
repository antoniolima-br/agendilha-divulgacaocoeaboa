import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { APP_SETTINGS_KEY, useAppSettings } from "@/data/useAppSettings";
import { HOME_VIDEO_BUCKET, STORAGE_PREFIX, isStoredFile, parseHomeVideo } from "@/lib/homeVideo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const MAX_MB = 50;

async function uploadFile(file: File, kind: "video" | "capa") {
  if (file.size > MAX_MB * 1024 * 1024) throw new Error(`O arquivo passa de ${MAX_MB} MB.`);
  const ext = (file.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${kind}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(HOME_VIDEO_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return `${STORAGE_PREFIX}${path}`;
}

/** Diretoria escolhe o vídeo de abertura e a capa da Home. O backend confere a permissão de novo. */
export function HomeVideoSettings() {
  const { data } = useAppSettings();
  const qc = useQueryClient();
  const [url, setUrl] = useState(""); const [cover, setCover] = useState(""); const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState<"video" | "capa" | null>(null);
  useEffect(() => {
    setUrl(data?.home_video_url ?? ""); setCover(data?.home_video_cover_url ?? ""); setTitle(data?.home_video_title ?? "");
  }, [data?.home_video_url, data?.home_video_cover_url, data?.home_video_title]);
  const invalid = url.trim() !== "" && !parseHomeVideo(url);

  const onFile = async (file: File | undefined, kind: "video" | "capa") => {
    if (!file) return;
    setUploading(kind);
    try {
      const stored = await uploadFile(file, kind);
      if (kind === "video") setUrl(stored); else setCover(stored);
      toast({ title: "Arquivo enviado!", description: "Agora é só tocar em Salvar." });
    } catch (e) {
      toast({ title: "Não deu pra enviar", description: (e as Error).message, variant: "destructive" });
    } finally { setUploading(null); }
  };

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("set_home_video", { p_url: url.trim(), p_cover: cover.trim(), p_title: title.trim() });
      if (error) throw error;
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: APP_SETTINGS_KEY }); toast({ title: "Vídeo da Home atualizado!" }); },
    onError: (e: Error) => toast({ title: "Não deu pra salvar", description: e.message, variant: "destructive" }),
  });

  const fileLabel = (v: string) => (isStoredFile(v) ? "Arquivo enviado" : v);

  return (
    <section className="mb-8 space-y-4 rounded-2xl border p-4">
      <div>
        <h2 className="text-lg font-semibold">Vídeo de abertura da Home</h2>
        <p className="text-sm text-muted-foreground">Toca uma vez quando a pessoa abre ou atualiza o app. Depois fica só a capa. Sem vídeo, aparece só a capa.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="hv-url">Vídeo (link do YouTube, Vimeo ou .mp4)</Label>
        <Input id="hv-url" value={fileLabel(url)} maxLength={500} readOnly={isStoredFile(url)}
          onChange={(e) => setUrl(e.target.value)} placeholder="https://youtube.com/..." />
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" disabled={!!uploading}>
            <label className="cursor-pointer"><Upload className="mr-1 h-4 w-4" />{uploading === "video" ? "Enviando…" : "Enviar vídeo do aparelho"}
              <input type="file" accept="video/mp4,video/webm,video/quicktime" className="sr-only" onChange={(e) => void onFile(e.target.files?.[0], "video")} /></label>
          </Button>
          {url && <Button variant="ghost" size="sm" onClick={() => setUrl("")}>Tirar vídeo</Button>}
        </div>
        {invalid && <p className="text-sm text-destructive">Esse link não dá pra tocar. Use YouTube, Vimeo ou um arquivo .mp4.</p>}
        <p className="text-xs text-muted-foreground">Arquivo até {MAX_MB} MB. Vídeo curto carrega mais rápido no celular.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="hv-cover">Imagem de capa</Label>
        <Input id="hv-cover" value={fileLabel(cover)} maxLength={500} readOnly={isStoredFile(cover)}
          onChange={(e) => setCover(e.target.value)} placeholder="https://..." />
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" disabled={!!uploading}>
            <label className="cursor-pointer"><Upload className="mr-1 h-4 w-4" />{uploading === "capa" ? "Enviando…" : "Enviar imagem"}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => void onFile(e.target.files?.[0], "capa")} /></label>
          </Button>
          {cover && <Button variant="ghost" size="sm" onClick={() => setCover("")}>Tirar capa</Button>}
        </div>
      </div>

      <div className="space-y-1"><Label htmlFor="hv-title">Frase da capa</Label>
        <Input id="hv-title" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} placeholder="O que tá rolando no Rio" /></div>

      <Button onClick={() => save.mutate()} disabled={invalid || save.isPending || !!uploading}>{save.isPending ? "Salvando…" : "Salvar"}</Button>
    </section>
  );
}
