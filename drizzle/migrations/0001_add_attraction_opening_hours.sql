ALTER TABLE public.atrativos
ADD COLUMN IF NOT EXISTS opening_hours text;

COMMENT ON COLUMN public.atrativos.opening_hours IS 'Horário de funcionamento em texto livre para exibição e uso no cadastro de eventos.';

CREATE OR REPLACE FUNCTION public.search_atrativos_autocomplete_v2(
  _q text DEFAULT NULL::text,
  _limit integer DEFAULT 20,
  _offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  name text,
  type text,
  tipo_atrativo text,
  style text,
  estilos text[],
  description text,
  opening_hours text,
  contact_whatsapp text,
  estabelecimento_id uuid,
  pais text,
  estado text,
  cidade_regiao text,
  logo_url text,
  fotos text[],
  is_approved boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT a.id, a.name, a.type, a.tipo_atrativo, a.style, a.estilos, a.description,
         a.opening_hours, a.contact_whatsapp, a.estabelecimento_id, a.pais, a.estado,
         a.cidade_regiao, a.logo_url, a.fotos, a.is_approved
    FROM public.atrativos a
   WHERE _q IS NULL OR btrim(_q) = '' OR
         translate(lower(a.name), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc')
         LIKE '%' || translate(lower(btrim(_q)), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc') || '%'
   ORDER BY a.is_approved DESC, a.name ASC
   LIMIT GREATEST(LEAST(_limit, 50), 1)
  OFFSET GREATEST(_offset, 0);
END;
$function$;

REVOKE ALL ON FUNCTION public.search_atrativos_autocomplete_v2(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_atrativos_autocomplete_v2(text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_atrativos_autocomplete_v2(text, integer, integer) TO service_role;