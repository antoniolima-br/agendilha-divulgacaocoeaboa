import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, Info, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: string;
  variation?: number;
  description?: string;
  onClick?: () => void;
  className?: string;
  variant?: "default" | "compact" | "minimal" | "selectable";
  selected?: boolean;
  selectedClassName?: string;
  iconRight?: React.ReactNode;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "text-primary bg-primary/10 border-primary/20",
  variation,
  description,
  onClick,
  className,
  variant = "default",
  selected,
  selectedClassName,
  iconRight
}: StatCardProps) {
  const [expanded, setExpanded] = useState(false);

  const handleInteraction = (e: React.MouseEvent) => {
    if (onClick) {
      e.stopPropagation();
      onClick();
    } else if (description) {
      setExpanded(!expanded);
    }
  };

  if (variant === "minimal") {
    return (
      <Card className={cn("border-border", className)}>
        <CardContent className="p-3 sm:p-4">
          <div className={cn("flex items-center gap-2 text-xs uppercase tracking-wider font-bold", tone)}>
            <Icon className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{label}</span>
          </div>
          <div className={cn("text-xl sm:text-2xl font-extrabold mt-1", tone)}>{value}</div>
        </CardContent>
      </Card>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4", className)}>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-primary shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs font-black uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="text-xl font-black text-foreground">{value}</div>
          {description && <div className="text-[10px] text-muted-foreground mt-0.5">{description}</div>}
        </div>
      </div>
    );
  }

  if (variant === "selectable") {
    return (
      <Card 
        role="button"
        aria-pressed={selected}
        className={cn(
          "h-auto min-h-[5rem] cursor-pointer border-2 bg-card p-3 shadow-sm transition-all hover:shadow-md active:scale-[0.98]",
          selected ? cn("border-primary ring-2 ring-primary/10 bg-primary/5", selectedClassName) : "border-transparent",
          className
        )}
        onClick={handleInteraction}
      >
        <div className="flex w-full items-start justify-between gap-2">
          <div>
            <p className={cn("flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider", tone)}>
              <Icon className="h-3.5 w-3.5" />
              {label}
            </p>
            <p className={cn("mt-0.5 text-2xl font-black", tone)}>{value}</p>
            {description && <p className="mt-0.5 hidden text-[10px] font-bold text-primary sm:block">{description}</p>}
          </div>
          {iconRight}
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "border-border bg-card shadow-sm transition-all duration-300 overflow-hidden group",
        (onClick || description) && "cursor-pointer active:scale-[0.98] active:shadow-sm",
        expanded ? "ring-2 ring-primary/20 scale-[1.02] shadow-md" : (onClick || description) ? "hover:scale-[1.01]" : "",
        className
      )}
      onClick={handleInteraction}
    >
      <CardContent className="p-0">
        <div className="p-5 flex items-center gap-4 relative">
          <div className={cn("h-12 w-12 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", tone)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-black flex items-center justify-between">
              <span className="truncate">{label}</span>
              {description && (expanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />)}
            </div>
            <div className="flex items-end gap-2">
              <div className="text-2xl font-black text-foreground tracking-tighter">
                {value}
              </div>
              {variation !== undefined && (
                <div className={cn("mb-1 flex items-center gap-0.5 text-[10px] font-black", variation >= 0 ? "text-success" : "text-destructive")}>
                  {variation >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(variation)}%
                </div>
              )}
            </div>
          </div>
        </div>
        
        {expanded && description && (
          <div className="px-5 pb-5 pt-0 animate-in slide-in-from-top-2 duration-200">
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                {description}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
