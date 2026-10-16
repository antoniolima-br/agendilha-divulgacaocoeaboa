import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock, Loader2, MapPin, Pencil, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type SubmitReviewEvent = {
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  image: File | string | null;
  events: SubmitReviewEvent[];
  location: string;
  neighborhood?: string;
  submitting: boolean;
  onConfirm: () => void;
};

function formatDate(value: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value || "");
  return m ? `${m[3]}/${m[2]}/${m[1]}` : value || "—";
}

/** Resumo final antes de mandar o rolê pra curadoria. */
export function SubmitReviewDialog({ open, onOpenChange, image, events, location, neighborhood, submitting, onConfirm }: Props) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!(image instanceof File)) { setObjectUrl(null); return; }
    const url = URL.createObjectURL(image);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);
  const preview = useMemo(() => (typeof image === "string" ? image : objectUrl), [image, objectUrl]);
  const place = [location, neighborhood].filter(Boolean).join(" · ") || "—";

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!submitting) onOpenChange(next); }}>
      <DialogContent className="max-h-[90dvh] w-[calc(100vw-1.5rem)] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confere antes de enviar?</DialogTitle>
          <DialogDescription>Dá uma olhada rápida. Se algo estiver errado, volta e ajusta.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
          <div className="mx-auto w-32 overflow-hidden rounded-lg border border-border bg-muted sm:mx-0">
            {preview ? (
              <img src={preview} alt="Flyer do rolê" className="h-auto w-full object-contain" />
            ) : (
              <p className="p-3 text-center text-xs text-muted-foreground">Sem flyer. A gente prepara um com os dados.</p>
            )}
          </div>
          <div className="min-w-0 space-y-3">
            {events.map((ev, i) => (
              <div key={i} className="space-y-1.5 border-b border-border pb-3 last:border-0 last:pb-0">
                <p className="break-words font-semibold">{ev.title || "Rolê sem título"}</p>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />{formatDate(ev.date)}
                </p>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  {ev.startTime || "—"}{ev.endTime ? ` às ${ev.endTime}` : ""}
                </p>
              </div>
            ))}
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="break-words">{place}</span>
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting} className="h-12 gap-2">
            <Pencil className="h-4 w-4" /> Voltar e editar
          </Button>
          <Button type="button" onClick={onConfirm} disabled={submitting} aria-busy={submitting} className="h-12 gap-2 font-bold">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar para Curadoria
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
