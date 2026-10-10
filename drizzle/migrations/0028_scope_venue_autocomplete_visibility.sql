CREATE OR REPLACE FUNCTION public.search_estabelecimentos_autocomplete(_q text DEFAULT NULL::text, _limit integer DEFAULT 20, _offset integer DEFAULT 0)
RETURNS TABLE(id uuid, nome text, endereco text, bairro text, cep text, numero text, complemento text, tipo text, tipos text[], contato text, fotos text[], is_approved boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  RETURN QUERY
  SELECT e.id, e.nome, e.endereco, e.bairro, e.cep, e.numero, e.complemento, e.tipo, e.tipos, e.contato, e.fotos, e.is_approved
  FROM public.estabelecimentos e
  WHERE e.listing_kind = 'event_venue'
    AND (e.is_approved = true OR e.created_by = auth.uid() OR e.responsavel_id = auth.uid() OR public.is_admin_or_master(auth.uid()) OR public.has_permission(auth.uid(), 'events.read'))
    AND (_q IS NULL OR btrim(_q) = '' OR translate(lower(e.nome), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc') LIKE '%' || translate(lower(btrim(_q)), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc') || '%')
  ORDER BY e.is_approved DESC, e.nome ASC LIMIT GREATEST(LEAST(_limit, 50), 1) OFFSET GREATEST(_offset, 0);
END;
$function$;
REVOKE ALL ON FUNCTION public.search_estabelecimentos_autocomplete(text, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_estabelecimentos_autocomplete(text, integer, integer) TO authenticated, service_role;