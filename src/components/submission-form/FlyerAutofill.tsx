import { useEffect, useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { AlertCircle, ImagePlus, Loader2, Upload, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { extractFlyer, safeFlyerPatch } from "@/lib/flyerExtraction";
import { prepareUploadImage } from "@/lib/uploadImage";
import type { SubmissionFormData } from "./schema";

export function FlyerAutofill({ form, onImage, onLoading }: {
  form: UseFormReturn<SubmissionFormData>;
  onImage: (file: File) => void;
  onLoading: (loading: boolean) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const manualFallback = "Não foi possível ler o flyer automaticamente agora, mas preencha os campos abaixo rapidinho.";
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const pick = async (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024 || file.size === 0) {
      setError("Escolha uma imagem JPG, PNG ou WEBP de até 8 MB."); return;
    }
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    const snapshot = form.getValues();
    setPreview(URL.createObjectURL(file)); onImage(file);
    setLoading(true); onLoading(true); setStatus(""); setError("");
    try {
      const prepared = await prepareUploadImage(file);
      if (controller.signal.aborted) return;
      const fields = await extractFlyer(prepared, controller.signal);
      if (controller.signal.aborted) return;
      const patch = safeFlyerPatch(fields, snapshot, form.getValues());
      for (const key of Object.keys(patch) as (keyof typeof patch)[]) {
        form.setValue(key, patch[key], { shouldDirty: true, shouldValidate: true });
      }
      setStatus(Object.keys(patch).length ? "Dados preenchidos. Confira título, data, horário e endereço antes de continuar." : "Nenhum campo vazio foi preenchido. Confira os dados abaixo ou envie outro flyer.");
    } catch (e) {
      if (!controller.signal.aborted) {
        setError(manualFallback);
        document.getElementById("manual-event-fields")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } finally {
      if (request.current === controller) { setLoading(false); onLoading(false); }
    }
  };

  const cancel = () => { request.current?.abort(); request.current = null; setLoading(false); onLoading(false); setStatus("Leitura interrompida. Você pode preencher os dados abaixo."); };

  return (
    <section aria-labelledby="flyer-upload-title" className="space-y-4 rounded-lg border border-primary/40 bg-primary/5 p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <ImagePlus className="mt-1 h-6 w-6 shrink-0 text-primary" />
        <div className="min-w-0 space-y-1">
          <h2 id="flyer-upload-title" className="font-display text-lg font-bold sm:text-xl">Quer economizar tempo?</h2>
          <p className="text-sm text-muted-foreground">Envie o flyer ou cartaz do evento aqui.</p>
        </div>
      </div>
      <div onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); void pick(event.dataTransfer.files[0]); }}
        className={`flex flex-col items-center gap-3 rounded-lg border border-dashed p-4 sm:flex-row ${dragging ? "border-primary bg-primary/10" : "border-border bg-background/50"}`}>
        {preview ? <img src={preview} alt="Flyer selecionado" className="h-32 w-24 shrink-0 rounded object-contain" /> : <Upload className="h-8 w-8 shrink-0 text-primary" />}
        <div className="min-w-0 flex-1 space-y-3 text-center sm:text-left">
          <p className="text-sm text-muted-foreground">Arraste a imagem ou escolha no seu aparelho.</p>
          <Button type="button" variant="outline" onClick={() => input.current?.click()} className="min-h-11 gap-2"><ImagePlus className="h-4 w-4" />{preview ? "Trocar flyer" : "Escolher flyer"}</Button>
          <p className="text-xs text-muted-foreground">JPG, PNG ou WEBP · até 8 MB</p>
        </div>
        <input ref={input} aria-label="Enviar flyer para preencher evento" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { void pick(event.target.files?.[0]); event.target.value = ""; }} />
      </div>
      <div aria-live="polite" aria-busy={loading}>
        {loading && <div className="space-y-3 rounded-md border border-primary/30 bg-primary/5 p-3"><div className="flex items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2 text-primary"><Loader2 className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none" />Lendo flyer com IA...</span><Button type="button" variant="ghost" size="icon" title="Interromper leitura" aria-label="Interromper leitura" onClick={cancel}><X className="h-4 w-4" /></Button></div><div aria-hidden="true" className="space-y-2"><div className="h-2 w-4/5 animate-pulse rounded bg-primary/20 motion-reduce:animate-none" /><div className="h-2 w-3/5 animate-pulse rounded bg-primary/20 motion-reduce:animate-none" /></div></div>}
        {!loading && status && <p className="flex items-start gap-2 text-sm text-muted-foreground"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{status}</p>}
      </div>
      {error && <p role="alert" className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm text-foreground"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{error}</p>}
      <Button type="button" variant="link" className="h-auto p-0 text-sm" onClick={() => { if (loading) cancel(); document.getElementById("manual-event-fields")?.scrollIntoView({ behavior: "auto", block: "start" }); }}>Prefiro preencher manualmente</Button>
    </section>
  );
}