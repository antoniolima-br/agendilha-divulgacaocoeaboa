ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS promotion_choice text NOT NULL DEFAULT 'free';

ALTER TABLE public.estabelecimentos
  ADD COLUMN IF NOT EXISTS listing_kind text NOT NULL DEFAULT 'event_venue';

ALTER TABLE public.submissions
  ADD CONSTRAINT submissions_promotion_choice_valid
  CHECK (promotion_choice IN ('free', 'highlight'));

ALTER TABLE public.estabelecimentos
  ADD CONSTRAINT estabelecimentos_listing_kind_valid
  CHECK (listing_kind IN ('event_venue', 'general_business'));

CREATE INDEX IF NOT EXISTS estabelecimentos_listing_kind_idx
  ON public.estabelecimentos (listing_kind, is_approved, nome);

CREATE OR REPLACE VIEW public.estabelecimentos_public
WITH (security_invoker = true)
AS
SELECT id, nome, endereco, bairro, cep, numero, complemento, tipo, tipos, fotos, created_at
FROM public.estabelecimentos
WHERE is_approved = true
  AND listing_kind = 'event_venue';

GRANT SELECT ON public.estabelecimentos_public TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.search_estabelecimentos_autocomplete(
  _q text DEFAULT NULL,
  _limit integer DEFAULT 20,
  _offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  nome text,
  endereco text,
  bairro text,
  cep text,
  numero text,
  complemento text,
  tipo text,
  tipos text[],
  contato text,
  fotos text[],
  is_approved boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT e.id, e.nome, e.endereco, e.bairro, e.cep, e.numero, e.complemento,
         e.tipo, e.tipos, e.contato, e.fotos, e.is_approved
    FROM public.estabelecimentos e
   WHERE e.listing_kind = 'event_venue'
     AND (_q IS NULL OR btrim(_q) = '' OR
         translate(lower(e.nome), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc')
         LIKE '%' || translate(lower(btrim(_q)), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc') || '%')
   ORDER BY e.is_approved DESC, e.nome ASC
   LIMIT GREATEST(LEAST(_limit, 50), 1)
  OFFSET GREATEST(_offset, 0);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.search_estabelecimentos_autocomplete(text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_estabelecimentos_autocomplete(text, integer, integer) TO service_role;

COMMENT ON COLUMN public.submissions.promotion_choice IS 'User choice at submission time; does not activate paid highlighting.';
COMMENT ON COLUMN public.estabelecimentos.listing_kind IS 'Separates event venues from general commercial businesses.';