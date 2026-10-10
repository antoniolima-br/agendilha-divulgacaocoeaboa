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
  variant?: "default" | "compact" | "minimal";
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
  variant = "default"
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
          <div className={cn("flex items-center gap-2 text-xs uppercase tracking-wider font-bold", tone.split(' ')[0])}>
            <Icon className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{label}</span>
          </div>
          <div className={cn("text-xl sm:text-2xl font-extrabold mt-1", tone.split(' ')[0])}>{value}</div>
        </CardContent>
      </Card>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4", className)}>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-primary shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="text-xl font-black text-foreground">{value}</div>
          {description && <div className="text-[10px] text-muted-foreground mt-0.5">{description}</div>}
        </div>
      </div>
    );
  }

  return (
    <Card 
      className={cn(
        "border-border bg-card shadow-sm transition-all duration-300 overflow-hidden group",
        (onClick || description) && "cursor-pointer",
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
                <div className={cn("text-[10px] font-black flex items-center gap-0.5 mb-1", variation >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
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
