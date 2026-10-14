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
          "flex h-11 w-full rounded-md border border-input bg-card/55 px-3.5 py-2 text-base text-foreground shadow-sm ring-offset-background transition-[border-color,background-color,box-shadow] duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground hover:border-primary/35 focus-visible:border-primary/55 focus-visible:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 md:h-10 md:text-sm",
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
