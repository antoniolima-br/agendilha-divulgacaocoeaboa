import { saveEventFlyerUrl } from "@/data/eventFlyers";
import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { qk } from "@/data/queryKeys";
import { handleError } from "@/lib/error-handler";
import { PUBLIC_EVENT_STATUSES } from "@/lib/eventDate";
import { uploadFlyerImage } from "@/lib/flyerImages";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Label } from "@/components/ui/label";
import { LoadingState } from "@/components/ui/LoadingState";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type FlyerEvent = {
  id: string;
  event_title: string | null;
  atrativo_name: string | null;
  date: string | null;
  image_url: string | null;
  is_highlight: boolean | null;
};

export function MainFlyerEditor() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [eventId, setEventId] = useState("");
  const [saving, setSaving] = useState(false);
  const eventsQuery = useQuery({
    queryKey: [...qk.submissions.all, "main-flyer-editor"],
    queryFn: async (): Promise<FlyerEvent[]> => {
      const { data, error } = await supabase
        .from("submissions")
        .select("id,event_title,atrativo_name,date,image_url,is_highlight")
        .in("status", [...PUBLIC_EVENT_STATUSES])
        .is("deleted_at", null)
        .order("is_highlight", { ascending: false })
        .order("date", { ascending: true })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });
  const selected = useMemo(() => eventsQuery.data?.find((event) => event.id === eventId) ?? null, [eventId, eventsQuery.data]);

  async function replaceFlyer(file?: File) {
    if (!file || !selected || !user) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size === 0 || file.size > 8 * 1024 * 1024) {
      toast.error("Escolha uma imagem JPG, PNG ou WEBP de até 8 MB.");
      return;
    }
    setSaving(true);
    try {
      const extension = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/principal-${selected.id}-${Date.now()}.${extension}`;
      const imageUrl = await uploadFlyerImage(file, path);
      const savedUrl = await saveEventFlyerUrl(selected.id, imageUrl);
      if (savedUrl !== imageUrl) throw new Error("A troca do flyer não foi confirmada.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: qk.home.all }),
        queryClient.invalidateQueries({ queryKey: qk.agenda.all }),
        queryClient.invalidateQueries({ queryKey: qk.submissions.all }),
        queryClient.invalidateQueries({ queryKey: qk.highlights.all }),
      ]);
      toast.success("Flyer principal atualizado na Home.");
    } catch (error) {
      handleError(error, "Não deu pra atualizar o flyer agora.");
    } finally {
      setSaving(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  if (eventsQuery.isLoading) return <LoadingState message="Carregando flyers publicados..." />;
  if (eventsQuery.isError) return <EmptyState icon={ImagePlus} title="Não deu pra carregar os flyers" description="Tente novamente em instantes." actionLabel="Tentar novamente" onAction={() => void eventsQuery.refetch()} />;
  if (!eventsQuery.data?.length) return <EmptyState icon={ImagePlus} title="Nenhum evento publicado" description="Quando houver um rolê publicado, o flyer poderá ser trocado aqui." />;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="main-flyer-event">Rolê exibido na Home</Label>
          <Select value={eventId} onValueChange={setEventId}>
            <SelectTrigger id="main-flyer-event" className="min-h-11"><SelectValue placeholder="Escolha um evento publicado" /></SelectTrigger>
            <SelectContent>
              {eventsQuery.data.map((event) => <SelectItem key={event.id} value={event.id}>{event.event_title || event.atrativo_name || "Rolê"}{event.is_highlight ? " · Destaque" : ""}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Selecionar novo flyer principal" onChange={(event) => void replaceFlyer(event.target.files?.[0])} />
        <Button type="button" onClick={() => inputRef.current?.click()} disabled={!selected || saving} className="min-h-11 gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {saving ? "Atualizando flyer..." : "Substituir flyer"}
        </Button>
        <p className="text-sm text-muted-foreground">A imagem oficial do evento é substituída e a Home recebe a atualização sem alterar aprovação ou pagamento.</p>
      </div>
      <div className="aspect-[4/5] overflow-hidden rounded-md border border-border bg-muted">
        {selected?.image_url ? <img src={selected.image_url} alt={`Flyer atual de ${selected.event_title || selected.atrativo_name || "evento"}`} className="h-full w-full object-contain" /> : <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground"><ImagePlus className="h-8 w-8" /><span>Este evento ainda não tem flyer.</span></div>}
      </div>
    </div>
  );
}