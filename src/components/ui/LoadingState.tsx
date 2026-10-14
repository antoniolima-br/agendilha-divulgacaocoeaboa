import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  fullPage?: boolean;
  className?: string;
}

export function LoadingState({ 
  message = "Buscando o rolê...", 
  fullPage = false,
  className 
}: LoadingStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center gap-4 rounded-2xl border border-border/60 bg-card/35 px-6 text-center animate-fade-in relative" role="status" aria-live="polite" overflow-hidden",
      fullPage ? "min-h-[60vh] w-full" : "min-h-48 py-10",
      className
    )}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse pointer-events-none" />
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/20 bg-primary/10 relative z-10">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
      <p className="relative z-10 max-w-sm text-sm font-semibold leading-relaxed text-muted-foreground" role="status" aria-live="polite">{message}</p>
    </div>
  );
}
