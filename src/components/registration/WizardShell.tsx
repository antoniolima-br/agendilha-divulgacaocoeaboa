import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepProgress } from "./StepProgress";

interface Props {
  title: string;
  subtitle?: string;
  step: number;
  totalSteps: number;
  children: ReactNode;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  loading?: boolean;
  canGoNext?: boolean;
  isLast?: boolean;
}

export function WizardShell({
  title,
  subtitle,
  step,
  totalSteps,
  children,
  onBack,
  onNext,
  nextLabel,
  loading,
  canGoNext = true,
  isLast,
}: Props) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (step === 1) navigate("/cadastro");
    else onBack();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg space-y-7 px-4 py-6 sm:px-6 sm:py-10">
        <Button type="button" variant="ghost" size="sm" onClick={handleBack} className="w-fit px-0 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        <StepProgress current={step} total={totalSteps} />

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold leading-tight text-foreground text-balance sm:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="text-base leading-relaxed text-muted-foreground">{subtitle}</p>
          )}
        </div>

        <div className="space-y-5">{children}</div>

        <Button
          onClick={onNext}
          disabled={!canGoNext || loading}
          className="h-12 w-full text-base sm:h-13"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            nextLabel ?? (isLast ? "Finalizar cadastro" : "Continuar")
          )}
        </Button>
      </div>
    </div>
  );
}