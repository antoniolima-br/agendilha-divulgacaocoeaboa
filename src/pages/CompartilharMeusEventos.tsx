import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Copy, MapPin, MessageCircle, Share2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LoadingState } from "@/components/ui/LoadingState";
import { useMyPublishedEvents } from "@/data/useMyPublishedEvents";
import { buildPromoterEventShare, type PromoterShareEvent } from "@/lib/promoterEventSharing";
import { formatBrazilianDate } from "@/lib/date-utils";
import { ROUTES } from "@/routes/config";

export default function CompartilharMeusEventos() {
  const { data: events = [], isLoading, isError, refetch } = useMyPublishedEvents();
  const [selected, setSelected] = useState<PromoterShareEvent | null>(null);
  const share = selected ? buildPromoterEventShare(selected, window.location.origin) : null;
  const copyMessage = async () => {
    if (!share) return;
    try {
      await navigator.clipboard.writeText(share.text);
      toast.success("Mensagem copiada!");
    } catch {
      toast.error("Não deu pra copiar.", { description: "Selecione a mensagem abaixo e copie, ou envie pelo WhatsApp." });
    }
  };
  return (
    <section className="mx-auto w-full max-w-3xl space-y-6 py-4 sm:py-8">
      <header className="space-y-3">
        <Button asChild variant="ghost" size="sm"><Link to={ROUTES.MEUS_EVENTOS}><ArrowLeft className="mr-2 h-4 w-4" />Meus eventos</Link></Button>
        <h1 className="break-words font-display text-2xl font-bold sm:text-3xl">Compartilhar meus eventos</h1>
      </header>
      {isLoading ? <LoadingState message="Buscando seus eventos publicados…" /> : isError ? (
        <div role="alert" className="space-y-3"><p className="text-destructive">Não deu pra buscar seus eventos. Tente novamente.</p><Button variant="outline" onClick={() => void refetch()}>Tentar novamente</Button></div>
      ) : events.length === 0 ? (
        <div className="space-y-3 py-10 text-center"><p className="text-muted-foreground">Você ainda não tem eventos aprovados com data atual ou futura.</p><Button asChild variant="outline"><Link to={ROUTES.MEUS_EVENTOS}>Acompanhar meus eventos</Link></Button></div>
      ) : (
        <ul className="space-y-4">
          {events.map(event => (
            <li key={event.id} className="flex min-w-0 gap-4 rounded-lg border border-border bg-card p-4">
              <div className="hidden h-24 w-20 shrink-0 overflow-hidden rounded-md bg-muted sm:flex sm:items-center sm:justify-center">
                {event.image_url ? <img src={event.image_url} alt={event.event_title || "Evento"} className="h-full w-full object-cover" loading="lazy" /> : <CalendarDays className="h-6 w-6 text-muted-foreground" />}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <h2 className="break-words text-lg font-semibold">{event.event_title || event.location || "Evento"}</h2>
                <p className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays className="h-4 w-4 shrink-0" />{formatBrazilianDate(event.date)}{event.start_time ? ` · ${event.start_time.slice(0, 5)}` : ""}</p>
                {event.location && <p className="flex items-start gap-2 break-words text-sm text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{event.location}</p>}
                {event.description && <p className="line-clamp-2 break-words text-sm text-muted-foreground">{event.description}</p>}
                <Button variant="outline" onClick={() => setSelected(event)} className="mt-2"><Share2 className="mr-2 h-4 w-4" />Gerar mensagem</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}>
        <DialogContent className="max-h-[85dvh] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto">
          <DialogHeader><DialogTitle>Compartilhar evento</DialogTitle><DialogDescription>{share?.title}</DialogDescription></DialogHeader>
          <pre className="max-h-[45dvh] overflow-y-auto whitespace-pre-wrap break-words rounded-md border border-border bg-muted/30 p-4 font-sans text-sm">{share?.text}</pre>
          <div className="flex flex-wrap gap-2">
            <Button asChild><a href={share ? `https://wa.me/?text=${encodeURIComponent(share.text)}` : undefined} target="_blank" rel="noopener noreferrer"><MessageCircle className="mr-2 h-4 w-4" />WhatsApp</a></Button>
            <Button variant="outline" onClick={() => void copyMessage()}><Copy className="mr-2 h-4 w-4" />Copiar mensagem</Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}