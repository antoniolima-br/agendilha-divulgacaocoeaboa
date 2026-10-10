import { ReactNode, useState } from "react";
import { Search, AlertTriangle, Plus, Info, LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AutocompleteFieldProps<T> {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  
  // Search State
  loading: boolean;
  error: Error | null;
  items: T[];
  hasMore?: boolean;
  loadingMore?: boolean;
  loadMore?: () => void;
  
  // Custom Rendering
  renderItem: (item: T, onSelect: () => void) => ReactNode;
  renderEmpty?: () => ReactNode;
  onCreateNew?: (name: string) => void;
  createNewText?: string;
  noResultsText?: string;
  loadingText?: string;
  errorText?: string;
  headerText?: string;
  
  // Validation / Warnings
  duplicateWarning?: ReactNode;
  
  // Icon
  Icon?: LucideIcon;
}

export function AutocompleteField<T>({
  value,
  onChange,
  placeholder,
  disabled,
  className,
  inputClassName,
  loading,
  error,
  items,
  hasMore,
  loadingMore,
  loadMore,
  renderItem,
  renderEmpty,
  onCreateNew,
  createNewText = "Cadastrar novo",
  noResultsText = "Nenhum resultado encontrado.",
  loadingText = "Buscando...",
  errorText = "Erro ao buscar resultados.",
  headerText,
  duplicateWarning,
  Icon = Search,
}: AutocompleteFieldProps<T>) {
  const [open, setOpen] = useState(false);

  const showNewHint = onCreateNew && value.trim().length >= 2 && !items.some(item => {
      // This is a bit tricky as we don't know the property name for 'name'
      // We'll rely on the caller to provide duplicateWarning logic if needed
      return false; 
  });

  const showDropdown = open && (items.length > 0 || loading || (value.trim().length >= 2) || !!error);

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className={cn("pl-9", inputClassName)}
          disabled={disabled}
          autoComplete="off"
        />
      </div>
      
      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg overflow-hidden max-h-72 overflow-y-auto">
          {headerText && value.trim().length < 1 && items.length > 0 && (
            <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/40">
              {headerText}
            </div>
          )}
          
          {items.map((item, idx) => renderItem(item, () => setOpen(false)))}
          
          {loading && items.length === 0 && (
            <div className="px-3 py-2 text-xs text-muted-foreground">{loadingText}</div>
          )}
          
          {error && (
            <div role="alert" className="px-3 py-2 text-xs text-destructive flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5" />
              {errorText}
            </div>
          )}
          
          {!loading && !error && items.length === 0 && value.trim().length >= 2 && (
            renderEmpty ? renderEmpty() : (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                {noResultsText}
              </div>
            )
          )}
          
          {hasMore && loadMore && (
            <button
              type="button"
              onMouseDown={(ev) => ev.preventDefault()}
              onClick={() => loadMore()}
              className="w-full px-3 py-2 text-xs font-medium text-primary hover:bg-muted border-t"
            >
              {loadingMore ? "Carregando..." : "Carregar mais"}
            </button>
          )}
          
          {onCreateNew && value.trim().length >= 2 && (
            <button
              type="button"
              onMouseDown={(ev) => ev.preventDefault()}
              onClick={() => {
                onCreateNew(value.trim());
                setOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-xs border-t bg-muted/30 hover:bg-muted flex items-center gap-2 text-primary font-semibold"
            >
              <Plus className="h-3.5 w-3.5" />
              {createNewText}: “{value.trim()}”
            </button>
          )}
        </div>
      )}
      
      {duplicateWarning}
    </div>
  );
}
