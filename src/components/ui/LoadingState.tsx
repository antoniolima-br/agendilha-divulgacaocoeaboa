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
      "flex flex-col items-center justify-center gap-4 rounded-lg border border-border/60 bg-card/35 px-6 text-center animate-fade-in",
      fullPage ? "min-h-[60vh] w-full" : "min-h-40 py-10",
      className
    )}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
      <p className="max-w-sm text-sm font-medium leading-relaxed text-muted-foreground">{message}</p>
    </div>
  );
}
