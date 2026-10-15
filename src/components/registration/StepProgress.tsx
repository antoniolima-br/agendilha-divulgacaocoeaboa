import { cn } from "@/lib/utils";

interface Props {
  current: number; // 1-based
  total: number;
  label?: string;
}

export function StepProgress({ current, total, label }: Props) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="w-full space-y-2.5" aria-label={`Etapa ${current} de ${total}`}>
      <div className="flex flex-wrap items-start justify-between gap-2 text-sm font-semibold text-muted-foreground">
        <span>
          Etapa {current} de {total}
        </span>
        {label && <span className="min-w-0 break-words text-xs leading-relaxed">{label}</span>}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full bg-primary transition-all duration-300")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}