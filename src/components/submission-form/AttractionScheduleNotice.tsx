import { AlertCircle, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import type { AttractionScheduleEntry } from "@/data/useAttractionSchedule";

function scheduleLabel(entry: AttractionScheduleEntry) {
  return entry.event_end
    ? `${entry.event_start} às ${entry.event_end}`
    : `${entry.event_start} (sem término informado)`;
}

export function AttractionScheduleNotice({
  entries,
  loading,
  failed,
}: {
  entries: AttractionScheduleEntry[];
  loading: boolean;
  failed: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Conferindo a agenda do atrativo…
      </div>
    );
  }

  if (failed) {
    return (
      <div role="alert" className="flex items-start gap-2 rounded-lg border border-warning/50 bg-warning/10 px-3 py-3 text-sm text-foreground">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
        <span>Não deu para conferir a agenda agora. Você pode continuar, e faremos uma nova verificação ao publicar.</span>
      </div>
    );
  }

  if (!entries.length) return null;

  return (
    <div className="space-y-2" aria-live="polite">
      {entries.map((entry) => {
        const conflict = entry.assessment === "conflict";
        const unknown = entry.assessment === "unknown";
        const Icon = conflict ? AlertCircle : unknown ? AlertTriangle : CheckCircle2;
        return (
          <div
            key={entry.event_id}
            role={conflict ? "alert" : "status"}
            className={
              conflict
                ? "flex items-start gap-2 rounded-lg border-2 border-destructive bg-destructive/10 px-3 py-3 text-sm font-semibold text-destructive"
                : unknown
                  ? "flex items-start gap-2 rounded-lg border border-warning/50 bg-warning/10 px-3 py-3 text-sm text-foreground"
                  : "flex items-start gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-3 text-sm text-foreground"
            }
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {conflict
                ? `Conflito: este atrativo já tem outro evento das ${scheduleLabel(entry)}. Mantenha pelo menos 2 horas livres entre as apresentações.`
                : unknown
                  ? `Atenção: este atrativo já tem outro evento às ${scheduleLabel(entry)}. Como falta um horário de término, não foi possível confirmar o intervalo de 2 horas.`
                  : `Atenção: este atrativo já tem outro evento das ${scheduleLabel(entry)}, mas respeita o intervalo mínimo de 2h.`}
            </span>
          </div>
        );
      })}
    </div>
  );
}