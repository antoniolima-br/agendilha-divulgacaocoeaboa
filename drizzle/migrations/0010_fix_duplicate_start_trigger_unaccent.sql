CREATE OR REPLACE FUNCTION public.prevent_duplicate_event_start_at_same_establishment()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  establishment_key text;
BEGIN
  IF NEW.deleted_at IS NOT NULL
     OR NEW.status <> ALL (ARRAY['pendente', 'aprovado', 'publicado', 'divulgado'])
     OR nullif(trim(coalesce(NEW.date, '')), '') IS NULL
     OR nullif(trim(coalesce(NEW.start_time, '')), '') IS NULL
     OR (NEW.estabelecimento_id IS NULL AND nullif(trim(coalesce(NEW.location, '')), '') IS NULL) THEN
    RETURN NEW;
  END IF;

  establishment_key := coalesce(
    NEW.estabelecimento_id::text,
    regexp_replace(translate(lower(trim(NEW.location)), 'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn'), '[^a-z0-9]+', '', 'g')
  );

  PERFORM pg_advisory_xact_lock(hashtextextended(
    NEW.user_id::text || ':' || establishment_key || ':' || left(NEW.date, 10) || ':' || left(NEW.start_time, 5), 0));

  IF EXISTS (
    SELECT 1 FROM public.submissions s
    WHERE s.deleted_at IS NULL
      AND s.status = ANY (ARRAY['pendente', 'aprovado', 'publicado', 'divulgado'])
      AND s.id IS DISTINCT FROM NEW.id
      AND s.user_id = NEW.user_id
      AND left(s.date, 10) = left(NEW.date, 10)
      AND left(s.start_time, 5) = left(NEW.start_time, 5)
      AND (
        (NEW.estabelecimento_id IS NOT NULL AND s.estabelecimento_id = NEW.estabelecimento_id)
        OR (NEW.estabelecimento_id IS NULL AND s.estabelecimento_id IS NULL
          AND regexp_replace(translate(lower(trim(coalesce(s.location, ''))), 'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn'), '[^a-z0-9]+', '', 'g') = establishment_key)
      )
  ) THEN
    RAISE EXCEPTION 'DUPLICATE_EVENT_START: informe um horário de início diferente para cada evento neste estabelecimento'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$function$;