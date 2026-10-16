CREATE OR REPLACE FUNCTION public.require_event_title_for_publication()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  -- Título do rolê é opcional: não bloqueia aprovação nem publicação.
  RETURN NEW;
END
$function$;
COMMENT ON FUNCTION public.require_event_title_for_publication() IS 'DEPRECATED: title is optional; kept as no-op.';

DO $do$
DECLARE d text;
BEGIN
  d := pg_get_functiondef('public.intranet_set_curation_status(uuid,text)'::regprocedure);
  d := regexp_replace(d, E'IF p_action=''approve'' AND EXISTS\\(\\s*SELECT 1 FROM public\\.submissions\\s*WHERE id=p_id AND nullif\\(btrim\\(event_title\\),''''\\) IS NULL\\s*\\) THEN\\s*RAISE EXCEPTION ''Preencha o título do rolê antes de aprovar'';\\s*END IF;', '');
  IF position('Preencha o título' in d) > 0 THEN RAISE EXCEPTION 'title check not removed'; END IF;
  EXECUTE d;
END
$do$;