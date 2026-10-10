import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function PitchWindow({ value, number, title, eyebrow, icon: Icon, children }: {
  value: string; number: string; title: string; eyebrow: string; icon: LucideIcon; children: ReactNode;
}) {
  return <AccordionItem value={value} className="pitch-window overflow-hidden border-b">
    <AccordionTrigger className="gap-4 bg-muted/50 px-4 py-5 text-left hover:bg-muted hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-6 sm:py-6 motion-reduce:transition-none [&>svg]:text-primary">
      <span className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
        <span className="pt-1 text-xs font-semibold text-primary">{number}</span>
        <span className="min-w-0 flex-1"><span className="mb-1 block text-xs font-medium uppercase text-muted-foreground">{eyebrow}</span><span className="block text-lg font-semibold leading-snug sm:text-2xl">{title}</span></span>
        <Icon aria-hidden="true" className="mt-1 hidden h-5 w-5 shrink-0 text-primary sm:block" />
      </span>
    </AccordionTrigger>
    <AccordionContent className="pitch-window-body border-t border-border motion-reduce:transition-none" >{children}</AccordionContent>
  </AccordionItem>;
}