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
    <div 
      role="status" 
      aria-live="polite"
      className={cn(
        "relative flex flex-col items-center justify-center gap-4 px-6 text-center animate-fade-in",
        fullPage ? "min-h-[60vh] w-full" : "min-h-48 py-10",
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/20 bg-primary/10 relative z-10">
        <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden="true" />
      </div>
      <p className="max-w-sm text-sm font-semibold leading-relaxed text-muted-foreground relative z-10">{message}</p>
    </div>
  );
}
