import { Copy, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { buildPromoterEventShare, type PromoterShareEvent } from "@/lib/promoterEventSharing";
export function ShareOwnEventDialog({ event, onClose }: { event: PromoterShareEvent | null; onClose: () => void }) {
  const share = event ? buildPromoterEventShare(event, window.location.origin) : null;
  async function copy() {
    if (!share) return;
    try { await navigator.clipboard.writeText(share.text); toast.success("Mensagem copiada!"); }
    catch { toast.error("Não deu pra copiar. Envie pelo WhatsApp ou selecione a mensagem abaixo."); }
  }
  return <Dialog open={!!event} onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="max-h-[85dvh] max-w-lg overflow-y-auto">
      <DialogHeader><DialogTitle>Compartilhar evento</DialogTitle><DialogDescription>{share?.title}</DialogDescription></DialogHeader>
      <pre className="max-h-[45dvh] overflow-y-auto whitespace-pre-wrap break-words rounded-md border border-border bg-muted/30 p-4 font-sans text-sm">{share?.text}</pre>
      <div className="flex flex-wrap gap-2">
        <Button asChild><a href={share ? `https://wa.me/?text=${encodeURIComponent(share.text)}` : undefined} target="_blank" rel="noopener noreferrer"><MessageCircle className="mr-2 h-4 w-4" />WhatsApp</a></Button>
        <Button variant="outline" onClick={() => void copy()}><Copy className="mr-2 h-4 w-4" />Copiar mensagem</Button>
      </div>
    </DialogContent>
  </Dialog>;
}
