import { useEffect, useRef, useState } from "react";
import { AlertCircle, ImagePlus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FlyerUpload({ image, onImage }: {
  image: File | string | null;
  onImage: (file: File) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
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
    onImage(file);
  };

  return (
    <section aria-label="Flyer do rolê" className="min-w-0 space-y-3 lg:sticky lg:top-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold"><ImagePlus className="h-5 w-5 text-primary" />Flyer do rolê</h2>
        <Button type="button" variant="outline" onClick={() => input.current?.click()} className="min-h-11 gap-2"><Upload className="h-4 w-4" />{preview ? "Trocar flyer" : "Escolher flyer"}</Button>
      </div>
      <div onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); pick(event.dataTransfer.files[0]); }}
        className={`flex min-h-40 w-full items-center justify-center rounded-lg border border-dashed ${dragging ? "border-primary bg-primary/10" : "border-border bg-muted/20"}`}>
        {preview ? <img src={preview} alt="Flyer oficial do rolê" className="max-h-[60dvh] w-full rounded-lg object-contain lg:max-h-[75dvh]" /> : <Upload className="h-10 w-10 text-muted-foreground" />}
        <input ref={input} aria-label="Enviar flyer do evento" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { pick(event.target.files?.[0]); event.target.value = ""; }} />
      </div>
      <p className="text-xs text-muted-foreground">Opcional · JPG, PNG ou WEBP · até 8 MB</p>
      {error && <p role="alert" className="flex items-start gap-2 text-sm text-foreground"><AlertCircle className="h-4 w-4 shrink-0 text-primary" />{error}</p>}
    </section>
  );
}
