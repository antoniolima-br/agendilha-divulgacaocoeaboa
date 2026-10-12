import type { UseFormReturn } from "react-hook-form";
import { Image as ImageIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { SubmissionFormData } from "../schema";

interface MediaStepProps {
  form: UseFormReturn<SubmissionFormData>;
  eventImage: File | string | null;
}

export function MediaStep({ form, eventImage }: MediaStepProps) {
  const savedImage = form.watch("eventImageUrl");
  const [preview, setPreview] = useState("");
  useEffect(() => {
    if (eventImage instanceof File) {
      const url = URL.createObjectURL(eventImage);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(typeof eventImage === "string" ? eventImage : savedImage || "");
  }, [eventImage, savedImage]);
  const hasImage = Boolean(eventImage || savedImage);
  return (
    <div className="space-y-4 animate-in fade-in motion-reduce:animate-none">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <ImageIcon className="h-5 w-5 shrink-0" />
          Flyer ou Banner do Evento <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          {hasImage
            ? "Seu flyer será a imagem oficial do evento. Confira os dados antes de finalizar."
            : "Pode seguir sem arte. Se escolher o evento patrocinado na revisão, seu flyer padrão será preparado ao finalizar. No envio gratuito, não há geração automática."}
        </p>
      </div>
      {preview && <img src={preview} alt="Flyer oficial do evento" className="h-64 w-full rounded-lg bg-muted/20 object-contain" />}
    </div>
  );
}
