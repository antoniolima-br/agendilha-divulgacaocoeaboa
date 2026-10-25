import { useState, type ComponentType, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export type MetricDetail = { label: string; value: ReactNode };

/** Compact metric tile; tapping opens a side panel with real supporting numbers only. */
export function MetricCard({ label, value, Icon, details, note }: { label: string; value: ReactNode; Icon?: ComponentType<{ className?: string }>; details?: MetricDetail[] | null; note?: string }) {
  const [open, setOpen] = useState(false);
  const rows = Array.isArray(details) ? details.filter((d) => d && d.label) : [];
  return <>
    <button type="button" onClick={() => setOpen(true)} aria-label={`Ver detalhes de ${label}`} className="group flex min-w-0 flex-col items-start rounded-lg border border-border bg-card p-2.5 text-left shadow-sm transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-4">
      <span className="flex w-full min-w-0 items-center gap-1.5 text-[11px] font-medium leading-tight text-muted-foreground sm:text-sm">{Icon && <Icon className="h-4 w-4 shrink-0 text-primary" />}<span className="line-clamp-2">{label}</span></span>
      <span className="mt-2 w-full break-words text-lg font-bold tabular-nums text-foreground sm:text-2xl">{value}</span>
      <span className="mt-1 flex items-center text-[11px] text-primary sm:text-xs">Detalhes <ChevronRight className="h-3 w-3" /></span>
    </button>
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader><SheetTitle>{label}</SheetTitle><SheetDescription>{note ?? "Números do período escolhido."}</SheetDescription></SheetHeader>
        <p className="mt-6 text-3xl font-bold tabular-nums">{value}</p>
        {rows.length > 0 ? <dl className="mt-6 divide-y border-y">{rows.map((d) => <div key={d.label} className="flex items-center justify-between gap-3 py-3 text-sm"><dt className="text-muted-foreground">{d.label}</dt><dd className="font-semibold tabular-nums">{d.value}</dd></div>)}</dl> : <p className="mt-6 text-sm text-muted-foreground">Ainda não tem mais detalhes registrados pra esse número.</p>}
      </SheetContent>
    </Sheet>
  </>;
}
