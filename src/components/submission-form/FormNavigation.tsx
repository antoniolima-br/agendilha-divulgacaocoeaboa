import { ArrowLeft, ArrowRight, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  isFirst: boolean;
  isLast: boolean;
  submitting: boolean;
  blocked: boolean;
  multiple: boolean;
  onBack: () => void;
  onNext: () => void;
};

/** Botões Voltar / Continuar / Publicar do cadastro de rolê. */
export function FormNavigation({ isFirst, isLast, submitting, blocked, multiple, onBack, onNext }: Props) {
  return (
    <div className="flex justify-between items-center pt-8 border-t">
      <Button type="button" variant="ghost" onClick={onBack} disabled={isFirst} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Button>

      {!isLast ? (
        // `key` distinto impede o React de reaproveitar o mesmo botão: sem isso, o clique em
        // "Continuar" virava "Publicar" no meio do evento e enviava o formulário sem passar pela Revisão.
        <Button key="next-step" type="button" onClick={onNext} className="gap-2 h-12 px-6 font-bold">
          Continuar <ArrowRight className="h-4 w-4" />
        </Button>
      ) : (
        <Button key="publish" type="submit" disabled={submitting || blocked} aria-busy={submitting} className="gap-2 h-12 px-6 gradient-sunset font-bold touch-manipulation">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {multiple ? "Publicar eventos" : "Publicar evento"}
        </Button>
      )}
    </div>
  );
}
