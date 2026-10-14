CREATE TABLE public.intranet_event_guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 120),
  whatsapp TEXT CHECK (whatsapp IS NULL OR whatsapp ~ '^55[0-9]{10,11}$'),
  origin TEXT NOT NULL DEFAULT 'curation' CHECK (origin IN ('curation', 'whatsapp', 'social', 'campaign', 'direct')),
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'opened', 'converted', 'declined')),
  invite_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  converted_at TIMESTAMPTZ,
  notes TEXT NOT NULL DEFAULT '' CHECK (char_length(notes) <= 1000),
  created_by UUID NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((status = 'converted' AND converted_at IS NOT NULL) OR status <> 'converted')
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.intranet_event_guests TO authenticated;
GRANT ALL ON public.intranet_event_guests TO service_role;

ALTER TABLE public.intranet_event_guests ENABLE ROW LEVEL SECURITY;
CREATE POLICY event_guests_read ON public.intranet_event_guests FOR SELECT TO authenticated USING (public.intranet_can_view());
CREATE POLICY event_guests_insert ON public.intranet_event_guests FOR INSERT TO authenticated WITH CHECK (public.intranet_can_edit_sector('administracao') AND created_by = auth.uid());
CREATE POLICY event_guests_update ON public.intranet_event_guests FOR UPDATE TO authenticated USING (public.intranet_can_edit_sector('administracao')) WITH CHECK (public.intranet_can_edit_sector('administracao'));
CREATE POLICY event_guests_delete ON public.intranet_event_guests FOR DELETE TO authenticated USING (public.intranet_can_edit_sector('administracao'));

CREATE INDEX intranet_event_guests_event_status_idx ON public.intranet_event_guests (event_id, status, invited_at DESC);
CREATE INDEX intranet_event_guests_created_idx ON public.intranet_event_guests (created_at DESC);

CREATE TRIGGER intranet_event_guests_updated_at
BEFORE UPDATE ON public.intranet_event_guests
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.flyer_engagement_events
  ADD COLUMN guest_id UUID REFERENCES public.intranet_event_guests(id) ON DELETE SET NULL;

CREATE INDEX flyer_engagement_events_guest_opened_idx
  ON public.flyer_engagement_events (guest_id, opened_at DESC)
  WHERE guest_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.record_event_open(
  p_event_id UUID,
  p_origin TEXT,
  p_channel TEXT,
  p_guest_token UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_origin TEXT := CASE WHEN p_origin IN ('direct', 'whatsapp', 'social', 'radar', 'campaign') THEN p_origin ELSE 'direct' END;
  v_channel TEXT := CASE
    WHEN p_channel IN ('direct', 'whatsapp', 'social', 'radar', 'campaign', 'curation_link', 'curation_qr', 'curation_whatsapp', 'curation_share') THEN p_channel
    ELSE v_origin
  END;
  v_guest_id UUID;
BEGIN
  SELECT id INTO v_guest_id
  FROM public.intranet_event_guests
  WHERE invite_token = p_guest_token AND event_id = p_event_id;

  UPDATE public.submissions
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = p_event_id
    AND deleted_at IS NULL
    AND status IN ('aprovado', 'approved', 'published', 'publicado');

  INSERT INTO public.flyer_engagement_events (event_id, origin, source_channel, guest_id)
  SELECT s.id, v_origin, v_channel, v_guest_id
  FROM public.submissions s
  WHERE s.id = p_event_id
    AND s.image_url IS NOT NULL
    AND btrim(s.image_url) <> ''
    AND s.deleted_at IS NULL
    AND s.status IN ('aprovado', 'approved', 'published', 'publicado');

  IF v_guest_id IS NOT NULL THEN
    UPDATE public.intranet_event_guests
    SET status = CASE WHEN status = 'invited' THEN 'opened' ELSE status END,
        updated_at = now()
    WHERE id = v_guest_id;
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.record_event_open(UUID, TEXT, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_event_open(UUID, TEXT, TEXT, UUID) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.intranet_guest_analytics(
  p_start_at TIMESTAMPTZ,
  p_end_at TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT public.intranet_can_view() THEN
    RAISE EXCEPTION 'Acesso restrito à equipe de gestão' USING ERRCODE = '42501';
  END IF;
  IF p_start_at IS NULL OR p_end_at IS NULL OR p_end_at <= p_start_at OR p_end_at - p_start_at > interval '366 days' THEN
    RAISE EXCEPTION 'Período inválido';
  END IF;

  WITH guest_rows AS (
    SELECT
      g.id,
      g.event_id,
      COALESCE(NULLIF(btrim(s.event_title), ''), NULLIF(btrim(s.location), ''), 'Rolê sem título') AS event_title,
      g.name,
      g.whatsapp,
      g.origin,
      g.status,
      g.invited_at,
      g.converted_at,
      count(f.id)::integer AS opens,
      min(f.opened_at) AS first_opened_at,
      max(f.opened_at) AS last_opened_at
    FROM public.intranet_event_guests g
    JOIN public.submissions s ON s.id = g.event_id
    LEFT JOIN public.flyer_engagement_events f ON f.guest_id = g.id
      AND f.opened_at >= p_start_at AND f.opened_at < p_end_at
    WHERE g.invited_at < p_end_at
      AND (g.invited_at >= p_start_at OR f.id IS NOT NULL OR (g.converted_at >= p_start_at AND g.converted_at < p_end_at))
    GROUP BY g.id, s.event_title, s.location
  )
  SELECT jsonb_build_object(
    'summary', jsonb_build_object(
      'guests', count(*)::integer,
      'opened', count(*) FILTER (WHERE opens > 0)::integer,
      'converted', count(*) FILTER (WHERE status = 'converted')::integer,
      'open_rate', CASE WHEN count(*) = 0 THEN NULL ELSE round(count(*) FILTER (WHERE opens > 0)::numeric * 100 / count(*), 1) END,
      'conversion_rate', CASE WHEN count(*) = 0 THEN NULL ELSE round(count(*) FILTER (WHERE status = 'converted')::numeric * 100 / count(*), 1) END
    ),
    'guests', COALESCE(jsonb_agg(to_jsonb(guest_rows) ORDER BY last_opened_at DESC NULLS LAST, invited_at DESC), '[]'::jsonb)
  ) INTO v_result
  FROM guest_rows;

  RETURN v_result;
END;
$function$;

REVOKE ALL ON FUNCTION public.intranet_guest_analytics(TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.intranet_guest_analytics(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated, service_role;