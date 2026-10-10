import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { fetchVenueSuggestions } from "@/data/autocomplete";
import { onEntityCreated } from "@/lib/entityEvents";
import { useAutocompleteSearch } from "@/hooks/useAutocompleteSearch";
import { AutocompleteField } from "@/components/ui/AutocompleteField";

export interface EstabelecimentoSuggestion {
  id: string;
  nome: string;
  endereco: string | null;
  bairro: string | null;
  cep: string | null;
  numero: string | null;
  complemento: string | null;
  tipo: string | null;
  contato: string | null;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelect: (estab: EstabelecimentoSuggestion) => void;
  placeholder?: string;
  className?: string;
  selected?: boolean;
  onCreateNew?: (name: string) => void;
}

export function EstabelecimentoAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Comece a digitar o nome do lugar. Se não aparecer, cadastre um novo.",
  className,
  onCreateNew,
}: Props) {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => onEntityCreated("estabelecimento", () => setRefreshKey((k) => k + 1)), []);

  const {
    items: suggestions,
    loading,
    loadingMore,
    hasMore,
    loadMore, 
    error,
  } = useAutocompleteSearch<EstabelecimentoSuggestion>({
    term: value,
    fetchPage: fetchVenueSuggestions,
    pageSize: 12,
    debounceMs: 150,
    refreshKey,
  });

  return (
    <AutocompleteField<EstabelecimentoSuggestion>
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      inputClassName="h-12 pr-10"
      loading={loading}
      error={error}
      items={suggestions}
      hasMore={hasMore}
      loadingMore={loadingMore}
      loadMore={loadMore}
      onCreateNew={onCreateNew}
      createNewText="Cadastrar novo estabelecimento"
      loadingText="Buscando locais..."
      errorText="Não deu pra buscar locais. Tente de novo em instantes."
      headerText="Locais já cadastrados"
      renderItem={(s, close) => (
        <button
          key={s.id}
          type="button"
          className="w-full px-4 py-2 text-left hover:bg-muted transition-colors text-sm flex items-start gap-2"
          onMouseDown={(e) => {
            e.preventDefault();
            onChange(s.nome);
            onSelect(s);
            close();
          }}
        >
          <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
          <span className="flex-1">
            <span className="font-semibold block">
              {s.nome}
              {s.bairro && <span className="font-normal text-muted-foreground"> — {s.bairro}</span>}
            </span>
            {s.endereco && (
              <span className="text-muted-foreground text-xs">{s.endereco}</span>
            )}
          </span>
        </button>
      )}
    />
  );
}
