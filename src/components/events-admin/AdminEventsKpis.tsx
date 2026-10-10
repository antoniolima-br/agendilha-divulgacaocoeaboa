import { AlertCircle, Clock3, CalendarDays, CheckCircle, XCircle } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
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
      tone: "text-primary",
      activeClass: "border-amber-400 ring-2 ring-amber-200",
      icon: AlertCircle,
      description: kpis.pending > 0 ? "Aguardando curadoria" : undefined,
      iconRight: <Clock3 className="mt-1 h-5 w-5 text-amber-500" />
    },
    {
      status: "aprovado",
      label: "Aprovados",
      value: kpis.approved,
      tone: "text-emerald-600",
      activeClass: "border-emerald-400 ring-2 ring-emerald-200",
      icon: CheckCircle,
    },
    {
      status: "rejeitado",
      label: "Rejeitados",
      value: kpis.rejected,
      tone: "text-rose-600",
      activeClass: "border-rose-400 ring-2 ring-rose-200",
      icon: XCircle,
    },
    {
      status: "all",
      label: "Total",
      value: kpis.total,
      tone: "text-foreground",
      activeClass: "border-primary ring-2 ring-primary/20",
      icon: CalendarDays,
    },
  ];

  return (
    <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4" aria-label="Filtrar eventos por status">
      {metrics.map((metric) => (
        <StatCard
          key={metric.status}
          variant="selectable"
          label={metric.label}
          value={metric.value}
          icon={metric.icon}
          tone={metric.tone}
          selected={activeStatus === metric.status}
          selectedClassName={metric.activeClass}
          description={metric.description}
          iconRight={metric.iconRight}
          onClick={() => onSelectStatus(metric.status)}
        />
      ))}
    </div>
  );
}
