import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, SlidersHorizontal } from "lucide-react";
import { categoryLabels, statusConfig } from "./adminEventsHelpers";

interface AdminEventsFiltersProps {
  search: string;
  statusFilter: string;
  categoryFilter: string;
  onSearchChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onClear: () => void;
}

/** Busca e seletores principais da curadoria. */
export function AdminEventsFilters({
  search, statusFilter, categoryFilter,
  onSearchChange, onStatusChange, onCategoryChange, onClear,
}: AdminEventsFiltersProps) {
  const activeFilters = [statusFilter, categoryFilter].filter((value) => value !== "all").length;

  return (
      <div className="mb-3 flex min-w-0 items-center gap-2 rounded-lg border border-border bg-card p-2 shadow-sm">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, empresa, local ou responsável..."
            className="pl-10 h-11 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/20"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Popover>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button variant={activeFilters > 0 ? "secondary" : "outline"} className="h-11 shrink-0 px-3 sm:px-4">
                    <SlidersHorizontal className="h-4 w-4" />
                    <span className="hidden sm:inline">Filtrar</span>
                    {activeFilters > 0 && <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">{activeFilters}</span>}
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>Filtrar eventos</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <PopoverContent align="end" sideOffset={8} className="w-[min(22rem,calc(100vw-2rem))] space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold">Filtrar eventos</p>
              {activeFilters > 0 && <Button variant="ghost" size="sm" onClick={onClear}>Limpar</Button>}
            </div>
            <Select value={statusFilter} onValueChange={onStatusChange}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {Object.entries(statusConfig).map(([key, cfg]) => <SelectItem key={key} value={key}>{cfg.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={onCategoryChange}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </PopoverContent>
        </Popover>
      </div>
  );
}
