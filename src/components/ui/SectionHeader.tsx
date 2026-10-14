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
    <div className={cn("mb-6 flex min-w-0 flex-col gap-4 border-b border-border/60 pb-5 sm:mb-8 sm:pb-6 md:flex-row md:items-end md:justify-between", className)}>
      <div className="min-w-0 space-y-2">
        <h1 className="break-words text-2xl font-semibold leading-tight text-foreground text-balance sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="max-w-2xl text-sm font-medium leading-relaxed text-muted-foreground sm:text-base">
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
