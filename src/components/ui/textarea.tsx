import * as React from "react";

import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[104px] w-full rounded-md border border-input bg-card/55 px-3.5 py-3 text-base text-foreground shadow-sm ring-offset-background transition-[border-color,background-color,box-shadow] duration-200 placeholder:text-muted-foreground hover:border-primary/35 focus-visible:border-primary/55 focus-visible:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 md:min-h-[88px] md:py-2.5 md:text-sm",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
