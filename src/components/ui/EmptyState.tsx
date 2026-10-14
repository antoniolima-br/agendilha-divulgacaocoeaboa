import { LucideIcon, SearchX } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = SearchX,
  title,
  description,
  actionLabel,
  onAction,
  className
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex min-h-48 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-card/35 p-6 text-center animate-fade-in sm:p-8",
      className
    )}>
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
        <Icon className="h-7 w-7" />
      </div>
      <div className="max-w-sm space-y-1.5">
        <h3 className="text-lg font-semibold leading-tight text-foreground">{title}</h3>
        {description && <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="px-6">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
