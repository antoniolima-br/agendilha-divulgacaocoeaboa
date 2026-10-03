import { CheckCircle, Eye, History, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { validateBrazilianMobile } from "@/lib/whatsapp";
import type { AdminSubmission } from "./adminEventsHelpers";

export type ModerationReviewKind = "approved" | "rejected" | "ajuste";

export interface ModerationReviewState {
  sub: AdminSubmission;
  kind: ModerationReviewKind;
  reason: string;
  message: string;
  submitting: boolean;
}

interface ModerationReviewDialogProps {
  review: ModerationReviewState | null;
  onClose: () => void;
  onReasonChange: (reason: string) => void;
  onMessageChange: (message: string) => void;
  onConfirm: () => void;
}

export function ModerationReviewDialog({
  review,
  onClose,
  onReasonChange,
  onMessageChange,
  onConfirm,
}: ModerationReviewDialogProps) {
  if (!review) return null;

  const phoneCheck = validateBrazilianMobile(review.sub.phone || "");
  const isApprove = review.kind === "approved";
  const isAjuste = review.kind === "ajuste";

  return (
    <Dialog open onOpenChange={(open) => !open && !review.submitting && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isApprove ? (
              <><CheckCircle className="h-5 w-5 text-success" /> Aprovar evento</>
            ) : isAjuste ? (
              <><History className="h-5 w-5 text-warning" /> Solicitar ajuste</>
            ) : (
              <><XCircle className="h-5 w-5 text-destructive" /> Rejeitar evento</>
            )}
          </DialogTitle>
          <DialogDescription className="text-sm">
            <span className="font-bold text-foreground">{review.sub.event_title}</span>
            {review.sub.responsible_name && <> — {review.sub.responsible_name}</>}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
          <div className={`rounded-lg border p-3 text-xs text-foreground ${phoneCheck.valid ? "border-success/50 bg-success/15" : "border-warning/50 bg-warning/15"}`}>
            {phoneCheck.valid ? (
              <>📱 WhatsApp do divulgador validado: <strong>{phoneCheck.display}</strong> — a mensagem abrirá em uma nova aba para você revisar e enviar.</>
            ) : (
              <>⚠️ Telefone inválido: {phoneCheck.reason} A ação ocorre normalmente, mas o WhatsApp não será aberto.</>
            )}
          </div>

          {!isApprove && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide">
                {isAjuste ? "O que precisa ajustar?" : "Motivo da rejeição (opcional)"}
              </Label>
              <Textarea
                rows={2}
                value={review.reason}
                onChange={(event) => onReasonChange(event.target.value.slice(0, 400))}
                placeholder={isAjuste ? "Ex: A data está incorreta ou falta a descrição." : "Ex.: Faltam dados de localização."}
              />
              <p className="text-[10px] text-muted-foreground">Será incluído como observação interna e na mensagem do WhatsApp.</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
              <Eye className="h-3.5 w-3.5" /> Pré-visualização da mensagem
            </Label>
            <Textarea
              rows={10}
              value={review.message}
              onChange={(event) => onMessageChange(event.target.value.slice(0, 1500))}
              className="font-mono text-xs leading-relaxed"
            />
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Você pode editar a mensagem antes de enviar.</span>
              <span>{review.message.length} / 1500</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={review.submitting}>Cancelar</Button>
          <Button
            onClick={onConfirm}
            disabled={review.submitting}
            className={isApprove ? "bg-success text-success-foreground hover:bg-success/90" : isAjuste ? "bg-warning text-warning-foreground hover:bg-warning/90" : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}
          >
            {review.submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : isApprove ? <CheckCircle className="mr-2 h-4 w-4" /> : isAjuste ? <History className="mr-2 h-4 w-4" /> : <XCircle className="mr-2 h-4 w-4" />}
            {isApprove ? "Aprovar e enviar WhatsApp" : isAjuste ? "Solicitar ajuste" : "Rejeitar e enviar WhatsApp"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}