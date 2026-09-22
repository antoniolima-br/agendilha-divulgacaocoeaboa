import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DashboardFiltersProps {
  filters: {
    period: string;
    neighborhood: string;
    category: string;
    status: string;
    userType: string;
  };
  setFilters: (filters: any) => void;
  neighborhoods: string[];
}

export function DashboardFilters({ filters, setFilters, neighborhoods }: DashboardFiltersProps) {
  const defaults = { period: "month", neighborhood: "all", category: "all", status: "all", userType: "all" };
  const activeFilters = Object.entries(defaults).filter(([key, value]) => filters[key as keyof typeof defaults] !== value).length;

  const resetFilters = () => {
    setFilters(defaults);
  };

  const updateFilter = (key: string, value: string) => {
    setFilters((prev: any) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex w-full justify-end sm:w-auto">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant={activeFilters > 0 ? "secondary" : "outline"} className="w-full sm:w-auto">
            <Filter className="h-4 w-4" /> Filtrar painel
            {activeFilters > 0 && <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">{activeFilters}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={8} className="w-[min(22rem,calc(100vw-2rem))] space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold">Filtrar painel</p>
            {activeFilters > 0 && <Button variant="ghost" size="sm" onClick={resetFilters}><X className="h-3.5 w-3.5" /> Limpar</Button>}
          </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Período</Label>
          <Select value={filters.period} onValueChange={(v) => updateFilter("period", v)}>
             <SelectTrigger className="bg-background/50 text-xs">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Última Semana</SelectItem>
              <SelectItem value="month">Último Mês</SelectItem>
              <SelectItem value="year">Último Ano</SelectItem>
              <SelectItem value="all">Todo o Período</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bairro</Label>
          <Select value={filters.neighborhood} onValueChange={(v) => updateFilter("neighborhood", v)}>
             <SelectTrigger className="bg-background/50 text-xs">
              <SelectValue placeholder="Bairro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Bairros</SelectItem>
              {neighborhoods.map(n => (
                <SelectItem key={n} value={n}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Categoria</Label>
          <Select value={filters.category} onValueChange={(v) => updateFilter("category", v)}>
             <SelectTrigger className="bg-background/50 text-xs">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Categorias</SelectItem>
              <SelectItem value="musica">Música</SelectItem>
              <SelectItem value="gastronomia">Gastronomia</SelectItem>
              <SelectItem value="cultura">Cultura / Arte</SelectItem>
              <SelectItem value="esporte">Esporte</SelectItem>
              <SelectItem value="promocoes">Promoções</SelectItem>
              <SelectItem value="outros">Outros</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</Label>
          <Select value={filters.status} onValueChange={(v) => updateFilter("status", v)}>
             <SelectTrigger className="bg-background/50 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="approved">Aprovado</SelectItem>
              <SelectItem value="rejected">Rejeitado</SelectItem>
              <SelectItem value="published">Publicado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        </PopoverContent>
      </Popover>
    </div>
  );
}
