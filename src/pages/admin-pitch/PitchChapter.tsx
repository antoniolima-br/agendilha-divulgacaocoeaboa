import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function PitchChapter({ value, number, title, eyebrow, icon: Icon, children }: {
  value: string; number: string; title: string; eyebrow: string; icon: LucideIcon; children: ReactNode;
}) {
  return <section id={`pitch-chapter-${value}`} aria-labelledby={`pitch-chapter-title-${value}`} className="min-w-0 space-y-6 border-t border-border py-10 sm:space-y-8 sm:py-14">
    <header className="flex items-start gap-4 border-b border-border pb-6">
      <Icon aria-hidden="true" className="mt-1 h-6 w-6 shrink-0 text-primary" />
      <div className="min-w-0 space-y-2">
        <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">{number} · {eyebrow}</p>
        <h2 id={`pitch-chapter-title-${value}`} className="break-words text-2xl font-semibold leading-tight">{title}</h2>
      </div>
    </header>
    {children}
  </section>;
}