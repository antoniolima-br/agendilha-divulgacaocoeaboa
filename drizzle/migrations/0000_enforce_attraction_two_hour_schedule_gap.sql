CREATE OR REPLACE FUNCTION public.normalize_schedule_attraction_name(input_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT lower(regexp_replace(translate(trim(coalesce(input_name, '')), 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇáàâãäéèêëíìîïóòôõöúùûüç', 'AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuuc'), '\s+', ' ', 'g'))
$$;

REVOKE ALL ON FUNCTION public.normalize_schedule_attraction_name(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.normalize_schedule_attraction_name(text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.check_attraction_schedule(
  p_atrativo_id uuid,
  p_artist_id uuid,
  p_atrativo_name text,
  p_date text,
  p_start_time text,
  p_end_time text DEFAULT NULL,
  p_exclude_submission_id uuid DEFAULT NULL
)
RETURNS TABLE (
  event_id uuid,
  event_start text,
  event_end text,
  assessment text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_start time;
  new_end time;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF nullif(trim(p_atrativo_name), '') IS NULL
     OR nullif(trim(p_date), '') IS NULL
     OR nullif(trim(p_start_time), '') IS NULL THEN
    RETURN;
  END IF;

  new_start := p_start_time::time;
  new_end := nullif(trim(coalesce(p_end_time, '')), '')::time;

  RETURN QUERY
  SELECT
    s.id,
    left(s.start_time, 5),
    CASE WHEN nullif(trim(coalesce(s.end_time, '')), '') IS NULL THEN NULL ELSE left(s.end_time, 5) END,
    CASE
      WHEN new_end IS NULL OR nullif(trim(coalesce(s.end_time, '')), '') IS NULL THEN 'unknown'
      WHEN (new_end + interval '2 hours' <= s.start_time::time)
        OR (s.end_time::time + interval '2 hours' <= new_start) THEN 'safe'
      ELSE 'conflict'
    END
  FROM public.submissions s
  WHERE s.deleted_at IS NULL
    AND s.status = ANY (ARRAY['pendente', 'aprovado', 'publicado', 'divulgado'])
    AND left(s.date, 10) = left(p_date, 10)
    AND s.id IS DISTINCT FROM p_exclude_submission_id
    AND nullif(trim(coalesce(s.start_time, '')), '') IS NOT NULL
    AND (
      (p_atrativo_id IS NOT NULL AND s.atrativo_id = p_atrativo_id)
      OR (p_artist_id IS NOT NULL AND s.artist_id = p_artist_id)
      OR public.normalize_schedule_attraction_name(s.atrativo_name) = public.normalize_schedule_attraction_name(p_atrativo_name)
    )
  ORDER BY s.start_time::time;
END;
$$;

REVOKE ALL ON FUNCTION public.check_attraction_schedule(uuid, uuid, text, text, text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_attraction_schedule(uuid, uuid, text, text, text, text, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.enforce_attraction_schedule_gap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conflicting_event uuid;
  lock_key text;
BEGIN
  IF NEW.deleted_at IS NOT NULL
     OR NEW.status <> ALL (ARRAY['pendente', 'aprovado', 'publicado', 'divulgado'])
     OR nullif(trim(coalesce(NEW.date, '')), '') IS NULL
     OR nullif(trim(coalesce(NEW.start_time, '')), '') IS NULL
     OR nullif(trim(coalesce(NEW.end_time, '')), '') IS NULL
     OR nullif(trim(coalesce(NEW.atrativo_name, '')), '') IS NULL THEN
    RETURN NEW;
  END IF;

  lock_key := coalesce(NEW.atrativo_id::text, NEW.artist_id::text, public.normalize_schedule_attraction_name(NEW.atrativo_name)) || ':' || left(NEW.date, 10);
  PERFORM pg_advisory_xact_lock(hashtextextended(lock_key, 0));

  SELECT s.id INTO conflicting_event
  FROM public.submissions s
  WHERE s.deleted_at IS NULL
    AND s.status = ANY (ARRAY['pendente', 'aprovado', 'publicado', 'divulgado'])
    AND left(s.date, 10) = left(NEW.date, 10)
    AND s.id IS DISTINCT FROM NEW.id
    AND nullif(trim(coalesce(s.start_time, '')), '') IS NOT NULL
    AND nullif(trim(coalesce(s.end_time, '')), '') IS NOT NULL
    AND (
      (NEW.atrativo_id IS NOT NULL AND s.atrativo_id = NEW.atrativo_id)
      OR (NEW.artist_id IS NOT NULL AND s.artist_id = NEW.artist_id)
      OR public.normalize_schedule_attraction_name(s.atrativo_name) = public.normalize_schedule_attraction_name(NEW.atrativo_name)
    )
    AND NOT (
      NEW.end_time::time + interval '2 hours' <= s.start_time::time
      OR s.end_time::time + interval '2 hours' <= NEW.start_time::time
    )
  LIMIT 1;

  IF conflicting_event IS NOT NULL THEN
    RAISE EXCEPTION 'ATTRACTION_SCHEDULE_CONFLICT: é necessário manter 2 horas entre as apresentações deste atrativo'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_attraction_schedule_gap() FROM PUBLIC;

CREATE TRIGGER enforce_attraction_schedule_gap_trigger
BEFORE INSERT OR UPDATE OF date, start_time, end_time, atrativo_id, artist_id, atrativo_name, status, deleted_at
ON public.submissions
FOR EACH ROW
EXECUTE FUNCTION public.enforce_attraction_schedule_gap();