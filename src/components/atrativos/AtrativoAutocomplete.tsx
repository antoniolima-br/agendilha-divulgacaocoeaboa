import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { onEntityCreated } from "@/lib/entityEvents";
import { useAutocompleteSearch } from "@/hooks/useAutocompleteSearch";
import { AutocompleteField } from "@/components/ui/AutocompleteField";

export interface AtrativoSuggestion {
  id: string;
  name: string;
  type: string | null;
  contact_info?: string | null;
  category_other?: string | null;
  estabelecimento_id: string | null;
  tipo_atrativo?: string | null;
  style?: string | null;
  estilos?: string[] | null;
  description?: string | null;
  opening_hours?: string | null;
  contact_whatsapp?: string | null;
  cidade_regiao?: string | null;
  estado?: string | null;
  pais?: string | null;
  logo_url?: string | null;
  fotos?: string[] | null;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSelect: (a: AtrativoSuggestion) => void;
  placeholder?: string;
  selected?: boolean;
  onCreateNew?: (name: string) => void;
  disabled?: boolean;
}

export function AtrativoAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  selected,
  onCreateNew,
  disabled,
}: Props) {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => onEntityCreated("atrativo", () => setRefreshKey((k) => k + 1)), []);

  const fetchPage = useCallback(
    async (q: string, from: number, to: number, signal: AbortSignal) => {
      const { data, error } = await supabase
        .rpc("search_atrativos_autocomplete_v2", {
          _q: q || null,
          _limit: to - from + 1,
          _offset: from,
        })
        .abortSignal(signal);
      if (error) throw error;
      return (data ?? []) as AtrativoSuggestion[];
    },
    [],
  );

  const {
    items: suggestions,
    loading,
    loadingMore,
    hasMore,
    loadMore, 
    error,
  } = useAutocompleteSearch<AtrativoSuggestion>({
    term: value,
    fetchPage,
    pageSize: 12,
    debounceMs: 150,
    refreshKey,
  });

  const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const exactMatch = suggestions.some(
    (s) => normalize(s.name) === normalize(value),
  );
  const duplicateWarning = !selected && exactMatch && value.trim().length >= 2;

  return (
    <AutocompleteField<AtrativoSuggestion>
      value={value}
      onChange={onChange}
      placeholder={placeholder ?? "Título do atrativo"}
      disabled={disabled}
      loading={loading}
      error={error}
      items={suggestions}
      hasMore={hasMore}
      loadingMore={loadingMore}
      loadMore={loadMore}
      onCreateNew={onCreateNew}
      createNewText="Cadastrar novo atrativo"
      noResultsText="Nenhum atrativo com esse nome ainda."
      loadingText="Buscando atrativos..."
      errorText="Não deu pra buscar atrativos. Tente de novo em instantes."
      headerText="Atrativos já cadastrados"
      renderItem={(s, close) => (
        <button
          key={s.id}
          type="button"
          onMouseDown={(ev) => ev.preventDefault()}
          onClick={() => {
            onSelect(s);
            close();
          }}
          className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex items-center justify-between gap-2"
        >
          <span className="font-medium truncate">{s.name}</span>
          {s.type && (
            <span className="text-xs text-muted-foreground shrink-0">{s.type}</span>
          )}
        </button>
      )}
      renderEmpty={() => (
        <div className="px-3 py-2 text-xs text-muted-foreground">
          Nenhum atrativo com esse nome ainda.
        </div>
      )}
      duplicateWarning={duplicateWarning ? (
        <div
          role="alert"
          className="mt-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 flex items-start gap-2"
          data-testid="atrativo-duplicate-alert"
        >
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>Já existe um atrativo com esse nome — selecione da lista pra reaproveitar.</span>
        </div>
      ) : null}
      onCreateNew={onCreateNew}
    />
  );
}
