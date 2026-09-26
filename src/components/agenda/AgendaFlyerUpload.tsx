import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { qk } from "@/data/queryKeys";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatEventDateTimeBR } from "@/lib/eventDate";
import type { AgendaEvent } from "./types";

const MAX_MB = 8;

export function AgendaFlyerUpload({ events, userId }: { events: AgendaEvent[]; userId: string }) {
  const qc = useQueryClient();
  const [eventId, setEventId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const sorted = useMemo(
    () => [...events].sort((a, b) => Number(!!a.image_url) - Number(!!b.image_url) || String(a.date).localeCompare(String(b.date))),
    [events],
  );
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  const pick = (f: File | null) => {
    if (f && !f.type.startsWith("image/")) return toast.error("Escolhe uma imagem (JPG, PNG ou WEBP).");
    if (f && f.size > MAX_MB * 1024 * 1024) return toast.error(`Imagem muito grande. Máximo ${MAX_MB} MB.`);
    setFile(f);
  };

  const submit = async () => {
    if (!eventId || !file) return;
    setSaving(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/flyer-${eventId}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("event-flyers").upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("event-flyers").getPublicUrl(path);
      const { error } = await supabase.from("submissions").update({ image_url: data.publicUrl }).eq("id", eventId);
      if (error) throw error;
      toast.success("Flyer no ar! Já aparece na agenda.");
      setFile(null);
      setEventId("");
      void qc.invalidateQueries({ queryKey: qk.agenda.events() });
    } catch (e) {
      console.error(e);
      toast.error("Não rolou enviar o flyer. Tenta de novo em instantes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mb-8 rounded-2xl border border-border/60 bg-card/60 p-4 sm:p-5" aria-label="Enviar flyer">
      <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-bold">
        <ImagePlus className="h-5 w-5 text-primary" /> Enviar flyer do evento
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">Troca a arte provisória pela imagem real. Eventos sem flyer aparecem primeiro.</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1 space-y-3">
          <Select value={eventId} onValueChange={setEventId}>
            <SelectTrigger className="min-h-11"><SelectValue placeholder="Escolhe o evento" /></SelectTrigger>
            <SelectContent className="max-h-72">
              {sorted.map((ev) => (
                <SelectItem key={ev.id} value={ev.id}>
                  {ev.image_url ? "" : "• "}{ev.event_title || ev.location || "Evento"} — {formatEventDateTimeBR(ev.date, ev.start_time)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 text-sm font-semibold hover:border-primary hover:text-primary">
            <Upload className="h-4 w-4" /> {file ? file.name : "Escolher imagem"}
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
          </label>
          <Button className="btn-gold min-h-11 w-full rounded-full font-bold" disabled={!eventId || !file || saving} onClick={submit}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar flyer"}
          </Button>
        </div>
        {preview && <img src={preview} alt="Prévia do flyer" className="mx-auto h-40 w-32 rounded-xl object-cover sm:h-48 sm:w-36" />}
      </div>
    </section>
  );
}
