import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";

export function PitchChapter({ value, number, title, eyebrow, icon: Icon, children }: {
  value: string; number: string; title: string; eyebrow: string; icon: LucideIcon; children: ReactNode;
}) {
  return <TabsContent value={value} className="min-w-0 space-y-8 pt-8 sm:space-y-10">
    <header className="flex items-start gap-4 border-b border-border pb-6">
      <Icon aria-hidden="true" className="mt-1 h-6 w-6 shrink-0 text-primary" />
      <div className="min-w-0 space-y-2">
        <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">{number} · {eyebrow}</p>
        <h2 className="text-2xl font-semibold leading-tight">{title}</h2>
      </div>
    </header>
    {children}
  </TabsContent>;
}