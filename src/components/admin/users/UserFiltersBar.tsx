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
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-3 shadow-sm sm:p-4">
      <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Pesquisa global de usuários"
            placeholder="Pesquisar nome, e-mail, WhatsApp, bairro, tipo ou papel..."
            className="h-12 pl-10 pr-11 text-base"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />
          {filterSearch && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1.5 top-1/2 h-9 w-9 -translate-y-1/2"
              aria-label="Limpar pesquisa"
              onClick={() => setFilterSearch("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Tipo de Usuário" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="admin">Administrador</SelectItem>
            <SelectItem value="usuario">Usuário público</SelectItem>
            <SelectItem value="divulgador">Divulgador</SelectItem>
            <SelectItem value="estabelecimento">Estabelecimento</SelectItem>
            <SelectItem value="artist">Músico / Artista</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Status/Papel" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
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

        <Select value={filterPeriod} onValueChange={setFilterPeriod}>
          <SelectTrigger className="w-full">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Período" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo o Período</SelectItem>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="week">Última Semana</SelectItem>
            <SelectItem value="month">Último Mês</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}