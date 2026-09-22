import { Button } from "@/components/ui/button";
import { AlertCircle, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminEventsKpiData } from "./adminEventsHelpers";

interface AdminEventsKpisProps {
  kpis: AdminEventsKpiData;
  activeStatus: string;
  onSelectStatus: (status: string) => void;
}

/** Cartões de resumo da curadoria — clicar filtra a lista pelo status. */
export function AdminEventsKpis({ kpis, activeStatus, onSelectStatus }: AdminEventsKpisProps) {
  const metrics = [
    {
      status: "pendente",
      label: "Pendentes",
      value: kpis.pending,
      valueClass: "text-amber-600",
      labelClass: "text-amber-700",
      activeClass: "border-amber-400 ring-2 ring-amber-200",
      icon: kpis.pending > 0 ? <AlertCircle className="h-3.5 w-3.5" /> : null,
      detail: kpis.pending > 0 ? "Aguardando curadoria" : null,
    },
    {
      status: "aprovado",
      label: "Aprovados",
      value: kpis.approved,
      valueClass: "text-emerald-600",
      labelClass: "text-muted-foreground/70",
      activeClass: "border-emerald-400 ring-2 ring-emerald-200",
    },
    {
      status: "rejeitado",
      label: "Rejeitados",
      value: kpis.rejected,
      valueClass: "text-rose-600",
      labelClass: "text-muted-foreground/70",
      activeClass: "border-rose-400 ring-2 ring-rose-200",
    },
    {
      status: "all",
      label: "Total",
      value: kpis.total,
      valueClass: "text-foreground/70",
      labelClass: "text-muted-foreground/70",
      activeClass: "border-primary ring-2 ring-primary/20",
    },
  ];

  return (
    <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4" aria-label="Filtrar eventos por status">
      {metrics.map((metric) => {
        const selected = activeStatus === metric.status;
        return (
          <Button
            key={metric.status}
            type="button"
            variant="outline"
            aria-pressed={selected}
            onClick={() => onSelectStatus(metric.status)}
            className={cn(
              "h-auto min-h-20 justify-start border-2 bg-card p-3 text-left shadow-sm transition-all hover:bg-card hover:shadow-md",
              selected ? metric.activeClass : "border-transparent",
            )}
          >
            <div className="flex w-full items-start justify-between gap-2">
              <div>
                <p className={cn("flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider", metric.labelClass)}>
                  {metric.icon}{metric.label}
                </p>
                 <p className={cn("mt-0.5 text-2xl font-black", metric.valueClass)}>{metric.value}</p>
                 {metric.detail && <p className="mt-0.5 hidden text-[10px] font-bold text-amber-700/80 sm:block">{metric.detail}</p>}
              </div>
              {metric.status === "pendente" && <Clock3 className="mt-1 h-5 w-5 text-amber-500" />}
            </div>
          </Button>
        );
      })}
    </div>
  );
}
