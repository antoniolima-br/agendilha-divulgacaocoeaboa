import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AgendaEmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
  onDivulgar: () => void;
}

/** Estado vazio da agenda, sempre indicando o próximo passo. */
export function AgendaEmptyState({
  hasFilters,
  onClearFilters,
  onDivulgar,
}: AgendaEmptyStateProps) {
  return (
    <div className="px-6 py-12 text-center animate-fade-in">
      <div className="bg-background w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm ring-8 ring-muted/5">
        <CalendarDays className="h-10 w-10 text-muted-foreground/70" />
      </div>
      <h3 className="mb-3 text-xl font-semibold text-foreground">
        A cidade tá descansando...
      </h3>
      <p className="mx-auto mb-6 max-w-md text-base leading-relaxed text-muted-foreground">
        {hasFilters
          ? "Não achamos nada com esses filtros. Tenta abrir mais a busca."
          : "Por enquanto não tem rolê publicado pros próximos dias. Dá uma passada depois."}
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        {hasFilters && (
          <Button
            variant="outline"
            onClick={onClearFilters}
            className="w-full sm:w-auto"
          >
            Limpar Filtros
          </Button>
        )}
        <Button
          variant="default"
          onClick={onDivulgar}
          className="w-full sm:w-auto"
        >
          Divulgar meu Evento
        </Button>
      </div>
    </div>
  );
}
