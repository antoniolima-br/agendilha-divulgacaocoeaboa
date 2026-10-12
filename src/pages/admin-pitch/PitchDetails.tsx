import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export function PitchDetails({ children }: { children: ReactNode }) {
  return <details className="group min-w-0 border-t border-border pt-5">
    <summary className="flex min-h-11 w-fit max-w-full cursor-pointer list-none items-center gap-2 text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
      <span className="group-open:hidden">Ver detalhes</span>
      <span className="hidden group-open:inline">Recolher detalhes</span>
      <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 group-open:rotate-180" />
    </summary>
    <div className="mt-6 min-w-0 space-y-8">{children}</div>
  </details>;
}