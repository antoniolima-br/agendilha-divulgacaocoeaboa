import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { useFieldSuggestions } from "@/hooks/useFieldSuggestions";
import { useEntityRevision } from "@/lib/entityEvents";
import { cn } from "@/lib/utils";

interface SuggestTextareaProps extends React.ComponentProps<typeof Textarea> {
  suggestFrom: string;
  suggestColumn: string;
  suggestLimit?: number;
  onSuggestionSelect: (value: string) => void;
}

export const SuggestTextarea = React.forwardRef<HTMLTextAreaElement, SuggestTextareaProps>(
  ({ suggestFrom, suggestColumn, suggestLimit = 5, onSuggestionSelect, value, className, onFocus, onBlur, ...props }, ref) => {
    const [focused, setFocused] = React.useState(false);
    const term = typeof value === "string" ? value : "";
    const revision = useEntityRevision();
    const { suggestions } = useFieldSuggestions({
      from: suggestFrom,
      column: suggestColumn,
      term,
      limit: suggestLimit,
      refreshKey: revision,
    });
    const visible = focused ? suggestions.filter((suggestion) => suggestion !== term) : [];

    return (
      <div className="relative">
        <Textarea
          ref={ref}
          value={value}
          className={className}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            window.setTimeout(() => setFocused(false), 120);
            onBlur?.(event);
          }}
          {...props}
        />
        {visible.length > 0 && (
          <div className="absolute z-50 mt-1 max-h-44 w-full overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md">
            {visible.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className={cn("block w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground")}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onSuggestionSelect(suggestion);
                  setFocused(false);
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  },
);
SuggestTextarea.displayName = "SuggestTextarea";