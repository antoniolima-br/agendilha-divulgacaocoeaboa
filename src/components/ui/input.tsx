import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    const isEmptyMaskedField =
      (type === "date" || type === "time" || type === "datetime-local" || type === "month") &&
      (props.value === "" || (props.value == null && props.defaultValue == null));

    return (
      <input
        type={type}
        data-mask-empty={isEmptyMaskedField ? "true" : undefined}
        className={cn(
          "flex h-11 w-full rounded-md border border-border/80 bg-field px-4 py-2 text-base text-foreground shadow-sm ring-offset-background transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground hover:border-primary/50 focus-visible:border-primary focus-visible:bg-field focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-1 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/30 disabled:cursor-not-allowed disabled:opacity-60 md:h-10 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
