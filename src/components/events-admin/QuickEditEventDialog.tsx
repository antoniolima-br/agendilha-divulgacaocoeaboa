import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { handleError } from "@/lib/error-handler";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface QuickEditableEvent {
  id: string;
  event_title?: string | null;
  date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  address_street?: string | null;
  address_neighborhood?: string | null;
  category?: string | null;
  description?: string | null;
  image_url?: string | null;
  status?: string | null;
}

const FIELDS = ["event_title", "date", "start_time", "end_time", "location", "address_street", "address_neighborhood", "category", "description", "image_url", "status"] as const;
type Field = (typeof FIELDS)[number];
type FormState = Record<Field, string>;

const STATUS_OPTIONS = [
  { value: "pendente", label: "Aguardando análise" },
  { value: "aprovado", label: "Publicado" },
  { value: "rejeitado", label: "Recusado" },
];

function toForm(ev: QuickEditableEvent | null): FormState {
  const out = {} as FormState;
  FIELDS.forEach((f) => { out[f] = (ev?.[f] as string | null | undefined) ?? ""; });
  if (!out.status) out.status = "pendente";
  return out;
}

export function QuickEditEventDialog({
  event,
  onClose,
  onSaved,
}: {
  event: QuickEditableEvent | null;
  onClose: () => void;
  onSaved: (updated: QuickEditableEvent) => void;
}) {
  const [form, setForm] = useState<FormState>(() => toForm(event));
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(toForm(event)); }, [event]);

  const set = (f: Field) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [f]: e.target.value }));

  async function save() {
    if (!event) return;
    if (!form.date) {
      toast.error("Coloca a data do rolê.");
      return;
    }
    setSaving(true);
    const payload: Record<string, string | null> = {};
    FIELDS.forEach((f) => { payload[f] = form[f].trim() || null; });
    payload.status = form.status;
    const { error } = await supabase.from("submissions").update(payload).eq("id", event.id);
    setSaving(false);
    if (error) {
      handleError(error, "Não deu pra salvar o evento agora");
      return;
    }
    toast.success(form.status === "aprovado" ? "Evento salvo e publicado." : "Evento salvo.");
    onSaved({ ...event, ...payload });
    onClose();
  }

  return (
    <Dialog open={!!event} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar evento</DialogTitle>
          <DialogDescription>Ajuste direto aqui, sem passar pelo formulário de envio.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="qe-title">Nome do rolê</Label>
            <Input id="qe-title" value={form.event_title} onChange={set("event_title")} className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qe-date">Data</Label>
            <Input id="qe-date" type="date" value={form.date} onChange={set("date")} className="h-11" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="qe-start">Começa</Label>
              <Input id="qe-start" type="time" value={form.start_time.slice(0, 5)} onChange={set("start_time")} className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qe-end">Termina</Label>
              <Input id="qe-end" type="time" value={form.end_time.slice(0, 5)} onChange={set("end_time")} className="h-11" />
            </div>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="qe-location">Local</Label>
            <Input id="qe-location" value={form.location} onChange={set("location")} className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qe-street">Endereço</Label>
            <Input id="qe-street" value={form.address_street} onChange={set("address_street")} className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qe-bairro">Bairro</Label>
            <Input id="qe-bairro" value={form.address_neighborhood} onChange={set("address_neighborhood")} className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qe-cat">Categoria</Label>
            <Input id="qe-cat" value={form.category} onChange={set("category")} className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qe-status">Situação</Label>
            <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
              <SelectTrigger id="qe-status" className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="qe-img">Link da imagem do flyer</Label>
            <Input id="qe-img" value={form.image_url} onChange={set("image_url")} className="h-11" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="qe-desc">Descrição</Label>
            <Textarea id="qe-desc" rows={4} value={form.description} onChange={set("description")} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => void save()} disabled={saving} className="font-bold">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
