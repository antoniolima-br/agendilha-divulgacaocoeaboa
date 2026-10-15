import { useEffect, useRef, useState } from "react";
import { AlertCircle, ImagePlus, Upload, Loader2, Square, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { extractVisionFlyer, safeVisionPatch } from "@/lib/visionFlyer";
import type { UseFormReturn } from "react-hook-form";
import type { SubmissionFormData } from "./schema";
import mascotAsset from "@/assets/coezinho-mascot.webp.asset.json";

export function FlyerUpload({ image, onImage, form, preserveDate = false }: {
  image: File | string | null;
  onImage: (file: File) => void;
  form?: UseFormReturn<SubmissionFormData>;
  preserveDate?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController | null>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [reading, setReading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => { if (!image) { request.current?.abort(); setReading(false); setFeedback(""); } }, [image]);
  useEffect(() => {
    if (image instanceof File) {
      const url = URL.createObjectURL(image);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(image || "");
  }, [image]);

  const pick = (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024 || file.size === 0) {
      setError("Escolha uma imagem JPG, PNG ou WEBP de até 8 MB.");
      return;
    }
    setError("");
    setFeedback("");
    setCollapsed(false);
    request.current?.abort();
    onImage(file);
    if (!form) return;
    const controller = new AbortController();
    request.current = controller;
    const before = { ...form.getValues() };
    const protectedFields = new Set<string>();
    if (preserveDate || form.getFieldState("date").isDirty) protectedFields.add("date");
    const subscription = form.watch((_values, { name }) => { if (name) protectedFields.add(name); });
    setReading(true);
    void extractVisionFlyer(file, controller.signal).then((fields) => {
      if (controller.signal.aborted || request.current !== controller) return;
      subscription.unsubscribe();
      const patch = safeVisionPatch(fields, before, form.getValues(), protectedFields);
      for (const key of Object.keys(patch) as (keyof typeof patch)[]) {
        form.setValue(key, patch[key], { shouldDirty: true, shouldValidate: true });
      }
      setFeedback(Object.keys(fields).length ? "Li o flyer! Confira os dados do rolê e ajuste o que precisar." : "Não consegui identificar os dados. Você pode preencher tudo manualmente.");
    }).catch((failure: unknown) => {
      if (!controller.signal.aborted && request.current === controller) setError(failure instanceof Error ? failure.message : "Não consegui ler o flyer. Preencha os dados manualmente.");
    }).finally(() => {
      subscription.unsubscribe();
      if (request.current === controller) { request.current = null; setReading(false); }
    });
  };

  return (
    <section aria-label="Flyer do rolê" className="min-w-0 space-y-3 lg:sticky lg:top-24 lg:self-start">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold"><ImagePlus className="h-5 w-5 text-primary" />Flyer do rolê</h2>
        <div className="flex items-center gap-2">
          {preview && <Button type="button" variant="ghost" size="icon" className="min-h-11 min-w-11 lg:hidden" aria-label={collapsed ? "Ampliar flyer" : "Recolher flyer"} title={collapsed ? "Ampliar flyer" : "Recolher flyer"} aria-expanded={!collapsed} aria-controls="submission-flyer-preview" onClick={() => setCollapsed(value => !value)}>{collapsed ? <ChevronDown /> : <ChevronUp />}</Button>}
          <Button type="button" variant="outline" onClick={() => input.current?.click()} className="min-h-11 gap-2"><Upload className="h-4 w-4" />{preview ? "Trocar flyer" : "Escolher flyer"}</Button>
        </div>
      </div>
      <div id="submission-flyer-preview" onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); pick(event.dataTransfer.files[0]); }}
        className={`flex w-full items-center justify-center rounded-lg border border-dashed ${collapsed && preview ? "min-h-24 lg:min-h-40" : "min-h-40"} ${dragging ? "border-primary bg-primary/10" : "border-border bg-muted/20"}`}>
        {preview ? <img src={preview} alt="Flyer oficial do rolê" className={`${collapsed ? "max-h-24" : "max-h-[60dvh]"} w-full rounded-lg object-contain lg:max-h-[max(10rem,calc(100dvh-17rem))]`} /> : <Upload className="h-10 w-10 text-muted-foreground" />}
        <input ref={input} aria-label="Enviar flyer do evento" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { pick(event.target.files?.[0]); event.target.value = ""; }} />
      </div>
      <p className="text-xs text-muted-foreground">Opcional · JPG, PNG ou WEBP · até 8 MB</p>
      {reading && <div role="status" className="flex items-center gap-2 text-sm text-foreground">
        <img src={mascotAsset.url} alt="Coezinho" width={40} height={40} className="h-10 w-10 shrink-0 object-contain" />
        <Loader2 aria-hidden="true" className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none text-primary" />
        <span className="min-w-0 flex-1">Coezinho está analisando o flyer...</span>
        <Button type="button" variant="ghost" size="icon" aria-label="Parar leitura" title="Parar leitura" onClick={() => request.current?.abort()}><Square className="h-4 w-4" /></Button>
      </div>}
      {feedback && <p role="status" className="text-sm text-muted-foreground">{feedback}</p>}
      {error && <p role="alert" className="flex items-start gap-2 text-sm text-foreground"><AlertCircle className="h-4 w-4 shrink-0 text-primary" />{error}</p>}
    </section>
  );
}
