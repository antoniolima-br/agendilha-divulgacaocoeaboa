CREATE OR REPLACE FUNCTION public.prevent_duplicate_event_start_at_same_establishment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL
     OR NEW.status <> ALL (ARRAY['pendente', 'aprovado', 'publicado', 'divulgado'])
     OR NEW.estabelecimento_id IS NULL
     OR nullif(trim(coalesce(NEW.date, '')), '') IS NULL
     OR nullif(trim(coalesce(NEW.start_time, '')), '') IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(
      NEW.user_id::text || ':' || NEW.estabelecimento_id::text || ':' || left(NEW.date, 10) || ':' || left(NEW.start_time, 5),
      0
    )
  );

  IF EXISTS (
    SELECT 1
    FROM public.submissions s
    WHERE s.deleted_at IS NULL
      AND s.status = ANY (ARRAY['pendente', 'aprovado', 'publicado', 'divulgado'])
      AND s.id IS DISTINCT FROM NEW.id
      AND s.user_id = NEW.user_id
      AND s.estabelecimento_id = NEW.estabelecimento_id
      AND left(s.date, 10) = left(NEW.date, 10)
      AND left(s.start_time, 5) = left(NEW.start_time, 5)
  ) THEN
    RAISE EXCEPTION 'DUPLICATE_EVENT_START: informe um horário de início diferente para cada evento neste estabelecimento'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS submissions_prevent_duplicate_event_start ON public.submissions;
CREATE TRIGGER submissions_prevent_duplicate_event_start
BEFORE INSERT OR UPDATE OF user_id, estabelecimento_id, date, start_time, status, deleted_at
ON public.submissions
FOR EACH ROW
EXECUTE FUNCTION public.prevent_duplicate_event_start_at_same_establishment();