import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Users, Filter, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Props {
  isMaster: boolean;
  filterSearch: string;
  setFilterSearch: (v: string) => void;
  filterType: string;
  setFilterType: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  filterPeriod: string;
  setFilterPeriod: (v: string) => void;
}

export function UserFiltersBar({
  isMaster,
  filterSearch,
  setFilterSearch,
  filterType,
  setFilterType,
  filterStatus,
  setFilterStatus,
  filterPeriod,
  setFilterPeriod,
}: Props) {
  const activeFilters = [filterType, filterStatus, filterPeriod].filter((value) => value !== "all").length;

  const clearFilters = () => {
    setFilterType("all");
    setFilterStatus("all");
    setFilterPeriod("all");
  };

  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-card p-2 shadow-sm sm:p-3">
      <div className="relative min-w-0 flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          aria-label="Pesquisa global de usuários"
          placeholder="Pesquisar usuários..."
          className="h-11 pl-10 pr-10 text-base sm:pr-11"
          value={filterSearch}
          onChange={(e) => setFilterSearch(e.target.value)}
        />
        {filterSearch && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2"
            aria-label="Limpar pesquisa"
            onClick={() => setFilterSearch("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant={activeFilters > 0 ? "secondary" : "outline"}
            className="h-11 shrink-0 px-3 sm:px-4"
            aria-label={activeFilters > 0 ? `Filtrar usuários, ${activeFilters} ativos` : "Filtrar usuários"}
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filtrar</span>
            {activeFilters > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                {activeFilters}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={8} className="w-[min(22rem,calc(100vw-2rem))] space-y-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold">Filtrar usuários</p>
              <p className="text-xs text-muted-foreground">Refine a lista por perfil e período.</p>
            </div>
            {activeFilters > 0 && (
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                Limpar
              </Button>
            )}
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Users className="h-3.5 w-3.5" /> Tipo de usuário
              </label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="usuario">Usuário público</SelectItem>
                  <SelectItem value="divulgador">Divulgador</SelectItem>
                  <SelectItem value="estabelecimento">Estabelecimento</SelectItem>
                  <SelectItem value="artist">Músico / Artista</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Filter className="h-3.5 w-3.5" /> Papel
              </label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os papéis</SelectItem>
                  <SelectItem value="user">Público</SelectItem>
                  <SelectItem value="collaborator">Divulgador</SelectItem>
                  <SelectItem value="artist">Artista</SelectItem>
                  {isMaster && (
                    <>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="master">Admin Master</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" /> Período de cadastro
              </label>
              <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo o período</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}