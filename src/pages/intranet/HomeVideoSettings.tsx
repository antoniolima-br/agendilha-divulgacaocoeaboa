import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { APP_SETTINGS_KEY, useAppSettings } from "@/data/useAppSettings";
import { parseHomeVideo } from "@/lib/homeVideo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

/** Diretoria escolhe o vídeo e a capa do topo da Home. O backend confere a permissão de novo. */
export function HomeVideoSettings() {
  const { data } = useAppSettings();
  const qc = useQueryClient();
  const [url, setUrl] = useState(""); const [cover, setCover] = useState(""); const [title, setTitle] = useState("");
  useEffect(() => {
    setUrl(data?.home_video_url ?? ""); setCover(data?.home_video_cover_url ?? ""); setTitle(data?.home_video_title ?? "");
  }, [data?.home_video_url, data?.home_video_cover_url, data?.home_video_title]);
  const invalid = url.trim() !== "" && !parseHomeVideo(url);
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("set_home_video", { p_url: url.trim(), p_cover: cover.trim(), p_title: title.trim() });
      if (error) throw error;
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: APP_SETTINGS_KEY }); toast({ title: "Vídeo da Home atualizado!" }); },
    onError: (e: Error) => toast({ title: "Não deu pra salvar", description: e.message, variant: "destructive" }),
  });
  return (
    <section className="mb-8 space-y-3 rounded-2xl border p-4">
      <h2 className="text-lg font-semibold">Vídeo em destaque da Home</h2>
      <p className="text-sm text-muted-foreground">Cole um link do YouTube, Vimeo ou de um arquivo de vídeo. Sem link, a Home mostra só a capa.</p>
      <div className="space-y-1"><Label htmlFor="hv-url">Link do vídeo</Label>
        <Input id="hv-url" value={url} maxLength={500} onChange={(e) => setUrl(e.target.value)} placeholder="https://youtube.com/..." />
        {invalid && <p className="text-sm text-destructive">Esse link não dá pra tocar. Use YouTube, Vimeo ou um arquivo .mp4.</p>}</div>
      <div className="space-y-1"><Label htmlFor="hv-cover">Link da imagem de capa</Label>
        <Input id="hv-cover" value={cover} maxLength={500} onChange={(e) => setCover(e.target.value)} placeholder="https://..." /></div>
      <div className="space-y-1"><Label htmlFor="hv-title">Frase da capa</Label>
        <Input id="hv-title" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} placeholder="O que tá rolando na Ilha" /></div>
      <Button onClick={() => save.mutate()} disabled={invalid || save.isPending}>{save.isPending ? "Salvando…" : "Salvar vídeo"}</Button>
    </section>
  );
}
