import React from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, subtitle, rightElement, className }: SectionHeaderProps) {
  return (
    <div className={cn("mb-6 flex min-w-0 flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between", className)}>
      <div className="space-y-1.5 min-w-0">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-foreground uppercase leading-[1.1] break-words">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-medium leading-relaxed max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>
      {rightElement && (
        <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:gap-3 md:w-auto md:shrink-0">
          {rightElement}
        </div>
      )}
    </div>
  );
}
