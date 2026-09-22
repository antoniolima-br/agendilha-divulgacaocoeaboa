import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
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
  return (
      <div className="mb-6 grid grid-cols-1 items-center gap-3 rounded-lg border border-border bg-card p-2 shadow-sm md:grid-cols-12">
        <div className="md:col-span-5 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, empresa, local ou responsável..."
            className="pl-10 h-11 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/20"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="md:col-span-3">
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="h-11 bg-muted/30 border-none"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              {Object.entries(statusConfig).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-3">
          <Select value={categoryFilter} onValueChange={onCategoryChange}>
            <SelectTrigger className="h-11 bg-muted/30 border-none"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Categorias</SelectItem>
              {Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-1 flex justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-colors"
                  onClick={onClear}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Limpar Filtros</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
  );
}
