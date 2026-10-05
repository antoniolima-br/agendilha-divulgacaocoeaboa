import { memo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  text: string;
  url: string;
  onShare?: (platform: string) => void;
}

export const ShareDialog = memo(function ShareDialog({ open, onOpenChange, title, text, url, onShare }: ShareDialogProps) {
  const fullText = `${text}\n${url}`;

  const handleShare = async (platform: "whatsapp" | "copy") => {
    try {
      if (platform === "whatsapp") {
        window.open(`https://wa.me/?text=${encodeURIComponent(fullText)}`, "_blank", "noopener,noreferrer");
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado!");
      } else {
        throw new Error("CLIPBOARD_UNAVAILABLE");
      }
      onShare?.(platform);
      onOpenChange(false);
    } catch {
      toast.error("Não deu pra copiar o link.", { description: "Você pode selecionar e copiar o endereço do navegador." });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[92vw] sm:max-w-sm rounded-2xl p-6 sm:p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black font-display text-primary flex items-center gap-2 justify-center">
            <Share2 className="h-6 w-6 text-secondary" />
            Compartilhar
          </DialogTitle>
          <DialogDescription className="text-center font-medium mt-2">
            Escolha como você quer enviar este rolê.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 py-6">
          <Button 
            variant="outline" 
            className="h-12 rounded-full gap-2"
            onClick={() => handleShare('whatsapp')}
          >
            <MessageCircle className="h-5 w-5" />
            <span className="font-bold">WhatsApp</span>
          </Button>
          <Button variant="secondary" className="h-12 rounded-full font-bold gap-2" onClick={() => handleShare("copy")}>
            <Copy className="h-4 w-4" /> Copiar link
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});