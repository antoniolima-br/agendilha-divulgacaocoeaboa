import { AlertTriangle, RefreshCcw, LucideIcon } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  icon?: LucideIcon;
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "A conexão fugiu",
  message = "Não rolou carregar agora. Confere a internet e tenta de novo.",
  { icon: Icon = AlertTriangle, onRetry,
  className
}: ErrorStateProps) {
  return (
    <div role="alert" className={cn("flex min-h-48 flex-col items-center justify-center gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center animate-fade-in sm:p-8" role="alert" className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-destructive/25 bg-destructive/10 text-destructive">
        <Icon className="h-7 w-7" />
      </div>
      <div className="max-w-md space-y-1.5">
        <h3 className="text-lg font-semibold leading-tight text-foreground">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <RefreshCcw className="h-4 w-4" />
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
