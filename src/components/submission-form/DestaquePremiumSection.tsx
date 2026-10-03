import { Crown, Check, Gift, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

const BENEFITS = [
  "Flyer em evidência no carrossel principal de eventos",
  "Mais alcance e mais público pro seu rolê",
  "Posição prioritária na agenda durante o período contratado",
];

interface Props {
  submitting?: boolean;
  value: "free" | "highlight";
  onChange: (value: "free" | "highlight") => void;
}

/**
 * Seção premium de destaque exibida no final do formulário de divulgação.
 * Visual preto + amarelo vibrante, padrão Coe a Boa.
 */
export function DestaquePremiumSection({
  submitting,
  value,
  onChange,
}: Props) {
  return (
    <section aria-labelledby="promotion-choice-title" className="space-y-4">
      <div>
        <h2 id="promotion-choice-title" className="text-xl font-bold">Como você quer divulgar?</h2>
        <p className="mt-1 text-sm text-muted-foreground">A escolha vale para todos os eventos deste envio.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Tipo de anúncio">
        <button
          type="button"
          role="radio"
          aria-checked={value === "free"}
          disabled={submitting}
          onClick={() => onChange("free")}
          className={cn("min-h-32 rounded-lg border-2 p-4 text-left transition-colors", value === "free" ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/50")}
        >
          <Megaphone className="h-6 w-6 text-primary" aria-hidden />
          <span className="mt-3 block font-bold">Anúncio Gratuito</span>
          <span className="mt-1 block text-sm text-muted-foreground">Entra na agenda sem prioridade e sem flyer automático.</span>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={value === "highlight"}
          disabled={submitting}
          onClick={() => onChange("highlight")}
          className={cn("min-h-32 rounded-lg border-2 p-4 text-left transition-colors", value === "highlight" ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/50")}
        >
          <Crown className="h-6 w-6 text-primary" aria-hidden />
          <span className="mt-3 block font-bold">Anúncio com Destaque</span>
          <span className="mt-1 block text-sm text-muted-foreground">Recebe flyer oficial e segue para contratação após o envio.</span>
        </button>
      </div>
      {value === "highlight" && (
        <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
          <div className="flex items-start gap-3 rounded-md border border-primary/30 bg-primary/10 p-3">
            <Gift className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
            <div>
              <p className="text-sm font-bold">Cortesia de lançamento: destaque grátis</p>
              <p className="mt-1 text-xs text-muted-foreground">Durante o período de divulgação, você experimenta o alcance do app sem pagar.</p>
            </div>
          </div>
          <ul className="space-y-2">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden /> {benefit}
              </li>
            ))}
            <li className="text-xs text-muted-foreground">A equipe libera a cortesia após analisar o evento. Planos pagos poderão ser registrados futuramente.</li>
          </ul>
        </div>
      )}
    </section>
  );
}
