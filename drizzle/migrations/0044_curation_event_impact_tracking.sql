ALTER TABLE public.flyer_engagement_events
  ADD COLUMN source_channel TEXT NOT NULL DEFAULT 'direct';

ALTER TABLE public.flyer_engagement_events
  ADD CONSTRAINT flyer_engagement_source_channel_allowed
  CHECK (source_channel IN ('direct', 'whatsapp', 'social', 'radar', 'campaign', 'curation_link', 'curation_qr', 'curation_whatsapp', 'curation_share')) NOT VALID;

CREATE INDEX flyer_engagement_events_event_channel_opened_idx
  ON public.flyer_engagement_events (event_id, source_channel, opened_at DESC);

ALTER TABLE public.intranet_leads
  ADD COLUMN event_id UUID REFERENCES public.submissions(id) ON DELETE SET NULL;

CREATE INDEX intranet_leads_event_created_idx
  ON public.intranet_leads (event_id, created_at DESC)
  WHERE event_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.record_event_open(
  p_event_id UUID,
  p_origin TEXT DEFAULT 'direct',
  p_channel TEXT DEFAULT NULL
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
BEGIN
  UPDATE public.submissions
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = p_event_id
    AND deleted_at IS NULL
    AND status IN ('aprovado', 'approved', 'published', 'publicado');

  INSERT INTO public.flyer_engagement_events (event_id, origin, source_channel)
  SELECT s.id, v_origin, v_channel
  FROM public.submissions s
  WHERE s.id = p_event_id
    AND s.image_url IS NOT NULL
    AND btrim(s.image_url) <> ''
    AND s.deleted_at IS NULL
    AND s.status IN ('aprovado', 'approved', 'published', 'publicado');
END;
$function$;

REVOKE ALL ON FUNCTION public.record_event_open(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_event_open(UUID, TEXT, TEXT) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.intranet_curation_impact(
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
  IF NOT public.intranet_can_access('administracao') THEN
    RAISE EXCEPTION 'Sem acesso à Curadoria' USING ERRCODE = '42501';
  END IF;

  IF p_start_at IS NULL OR p_end_at IS NULL OR p_end_at <= p_start_at OR p_end_at - p_start_at > interval '366 days' THEN
    RAISE EXCEPTION 'Período inválido';
  END IF;

  WITH eligible AS (
    SELECT
      s.id,
      COALESCE(NULLIF(btrim(s.event_title), ''), NULLIF(btrim(s.location), ''), 'Rolê sem título') AS title,
      s.date AS event_date,
      s.start_time,
      s.image_url,
      s.status,
      COALESCE(s.views_count, 0)::integer AS lifetime_views
    FROM public.submissions s
    WHERE s.deleted_at IS NULL
      AND s.status IN ('aprovado', 'approved', 'published', 'publicado')
  ),
  opens AS (
    SELECT
      event_id,
      count(*)::integer AS total,
      count(*) FILTER (WHERE source_channel = 'curation_qr')::integer AS qr,
      count(*) FILTER (WHERE source_channel = 'curation_link')::integer AS link,
      count(*) FILTER (WHERE source_channel = 'curation_whatsapp')::integer AS whatsapp,
      count(*) FILTER (WHERE source_channel = 'curation_share')::integer AS share,
      count(*) FILTER (WHERE source_channel NOT IN ('curation_qr', 'curation_link', 'curation_whatsapp', 'curation_share'))::integer AS other
    FROM public.flyer_engagement_events
    WHERE opened_at >= p_start_at AND opened_at < p_end_at
    GROUP BY event_id
  ),
  favorites AS (
    SELECT event_id, count(*)::integer AS total
    FROM public.user_favorites
    WHERE created_at >= p_start_at AND created_at < p_end_at
    GROUP BY event_id
  ),
  leads AS (
    SELECT
      event_id,
      count(*)::integer AS total,
      count(*) FILTER (WHERE stage IN ('proposta', 'ganho'))::integer AS converted
    FROM public.intranet_leads
    WHERE event_id IS NOT NULL AND created_at >= p_start_at AND created_at < p_end_at
    GROUP BY event_id
  ),
  event_rows AS (
    SELECT
      e.id,
      e.title,
      e.event_date,
      e.start_time,
      e.image_url,
      e.status,
      e.lifetime_views,
      COALESCE(o.total, 0) AS opens,
      COALESCE(f.total, 0) AS favorites,
      COALESCE(l.total, 0) AS leads,
      COALESCE(l.converted, 0) AS conversions,
      jsonb_build_object(
        'qr_code', COALESCE(o.qr, 0),
        'link', COALESCE(o.link, 0),
        'whatsapp', COALESCE(o.whatsapp, 0),
        'share', COALESCE(o.share, 0),
        'other', COALESCE(o.other, 0)
      ) AS channels
    FROM eligible e
    LEFT JOIN opens o ON o.event_id = e.id
    LEFT JOIN favorites f ON f.event_id = e.id
    LEFT JOIN leads l ON l.event_id = e.id
  ),
  activity AS (
    SELECT * FROM (
      SELECT
        f.event_id,
        f.opened_at AS occurred_at,
        'open'::text AS kind,
        f.source_channel AS source,
        'Visitante não identificado'::text AS person,
        NULL::text AS detail
      FROM public.flyer_engagement_events f
      WHERE f.opened_at >= p_start_at AND f.opened_at < p_end_at
      UNION ALL
      SELECT
        uf.event_id,
        uf.created_at,
        'favorite',
        'app',
        'Pessoa autenticada',
        NULL::text
      FROM public.user_favorites uf
      WHERE uf.created_at >= p_start_at AND uf.created_at < p_end_at
      UNION ALL
      SELECT
        il.event_id,
        il.created_at,
        CASE WHEN il.stage IN ('proposta', 'ganho') THEN 'conversion' ELSE 'lead' END,
        il.origin,
        il.company,
        il.contact
      FROM public.intranet_leads il
      WHERE il.event_id IS NOT NULL AND il.created_at >= p_start_at AND il.created_at < p_end_at
    ) timeline
    ORDER BY occurred_at DESC
    LIMIT 150
  )
  SELECT jsonb_build_object(
    'summary', jsonb_build_object(
      'opens', COALESCE(sum(opens), 0)::integer,
      'favorites', COALESCE(sum(favorites), 0)::integer,
      'leads', COALESCE(sum(leads), 0)::integer,
      'conversions', COALESCE(sum(conversions), 0)::integer
    ),
    'events', COALESCE((SELECT jsonb_agg(to_jsonb(r) ORDER BY r.opens DESC, r.event_date, r.start_time) FROM event_rows r), '[]'::jsonb),
    'activity', COALESCE((SELECT jsonb_agg(to_jsonb(a) ORDER BY a.occurred_at DESC) FROM activity a), '[]'::jsonb)
  )
  INTO v_result
  FROM event_rows;

  RETURN v_result;
END;
$function$;

REVOKE ALL ON FUNCTION public.intranet_curation_impact(TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.intranet_curation_impact(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated, service_role;