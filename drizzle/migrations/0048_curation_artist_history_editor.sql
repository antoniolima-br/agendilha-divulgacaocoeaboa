ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS artist_history text;

COMMENT ON COLUMN public.submissions.artist_history IS 'Curatorial history of the main attraction, including prior venues, festivals, cities, and stages.';

CREATE OR REPLACE FUNCTION public.intranet_curation_event_editor()
RETURNS TABLE(
  id uuid,
  event_title text,
  date text,
  start_time text,
  video_link text,
  image_url text,
  artist_history text,
  status text,
  slug text,
  deleted_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT s.id, s.event_title, s.date, s.start_time, s.video_link, s.image_url,
         s.artist_history, s.status, s.slug, s.deleted_at
  FROM public.submissions s
  WHERE public.intranet_can_access('administracao')
    AND s.deleted_at IS NULL
  ORDER BY public.event_day_sp(s.date) DESC NULLS LAST, s.start_time DESC NULLS LAST, s.created_at DESC
$function$;

REVOKE ALL ON FUNCTION public.intranet_curation_event_editor() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.intranet_curation_event_editor() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.intranet_save_curation_event_v2(
  p_id uuid,
  p_title text,
  p_date text,
  p_start_time text,
  p_video_link text DEFAULT NULL,
  p_image_url text DEFAULT NULL,
  p_artist_history text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
  v_slug text;
  v_title text := nullif(btrim(p_title), '');
  v_date text := nullif(btrim(p_date), '');
  v_time text := nullif(btrim(p_start_time), '');
  v_link text := nullif(btrim(p_video_link), '');
  v_image text := nullif(btrim(p_image_url), '');
  v_artist_history text := nullif(btrim(p_artist_history), '');
BEGIN
  IF NOT public.intranet_can_edit_sector('administracao') THEN
    RAISE EXCEPTION 'Edição restrita à equipe responsável pela Curadoria' USING ERRCODE='42501';
  END IF;
  IF v_title IS NULL OR v_date IS NULL OR v_time IS NULL THEN
    RAISE EXCEPTION 'Informe nome, data e horário do rolê';
  END IF;
  IF public.event_day_sp(v_date) IS NULL THEN
    RAISE EXCEPTION 'Informe uma data válida';
  END IF;
  IF v_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' THEN
    RAISE EXCEPTION 'Informe um horário válido';
  END IF;
  IF v_link IS NOT NULL AND v_link !~ '^https://[^[:space:]]+$' THEN
    RAISE EXCEPTION 'O link de inscrição deve começar com https://';
  END IF;
  IF v_image IS NOT NULL AND v_image !~ '^https://[^[:space:]]+$' THEN
    RAISE EXCEPTION 'O link do flyer deve começar com https://';
  END IF;
  IF length(coalesce(v_artist_history, '')) > 4000 THEN
    RAISE EXCEPTION 'O histórico artístico pode ter até 4.000 caracteres';
  END IF;

  PERFORM set_config('app.intranet_moderation','yes',true);
  IF p_id IS NULL THEN
    INSERT INTO public.submissions (
      user_id, event_title, date, start_time, video_link, image_url, artist_history,
      status, approved_at, approved_by, published_at, stage,
      promotion_choice, is_free, terms_accepted, terms_accepted_at,
      duvidas_source, moderation_status
    ) VALUES (
      auth.uid(), v_title, v_date, v_time, v_link, v_image, v_artist_history,
      'aprovado', now(), auth.uid(), now(), 'production',
      'free', true, true, now(), 'curadoria', 'approved'
    )
    RETURNING submissions.id, submissions.slug INTO v_id, v_slug;
  ELSE
    UPDATE public.submissions s
       SET event_title=v_title,
           date=v_date,
           start_time=v_time,
           video_link=v_link,
           image_url=v_image,
           artist_history=v_artist_history
     WHERE s.id=p_id AND s.deleted_at IS NULL
     RETURNING s.id, s.slug INTO v_id, v_slug;
    IF v_id IS NULL THEN
      RAISE EXCEPTION 'Rolê não encontrado ou já removido';
    END IF;
  END IF;

  RETURN jsonb_build_object('id',v_id,'slug',v_slug);
END
$function$;

REVOKE ALL ON FUNCTION public.intranet_save_curation_event_v2(uuid,text,text,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.intranet_save_curation_event_v2(uuid,text,text,text,text,text,text) TO authenticated, service_role;