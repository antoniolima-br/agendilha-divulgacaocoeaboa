ALTER TABLE public.flyer_engagement_events
  ADD COLUMN origin TEXT NOT NULL DEFAULT 'direct';

ALTER TABLE public.flyer_engagement_events
  ADD CONSTRAINT flyer_engagement_origin_allowed
  CHECK (origin IN ('direct', 'whatsapp', 'social', 'radar', 'campaign')) NOT VALID;

CREATE INDEX flyer_engagement_events_origin_opened_idx
  ON public.flyer_engagement_events (origin, opened_at DESC);

ALTER TABLE public.intranet_leads
  ADD COLUMN origin TEXT NOT NULL DEFAULT 'direct';

ALTER TABLE public.intranet_leads
  ADD CONSTRAINT intranet_leads_origin_allowed
  CHECK (origin IN ('direct', 'whatsapp', 'social', 'radar', 'campaign')) NOT VALID;

CREATE OR REPLACE FUNCTION public.record_event_open(p_event_id uuid, p_origin text DEFAULT 'direct')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_origin text := CASE WHEN p_origin IN ('direct', 'whatsapp', 'social', 'radar', 'campaign') THEN p_origin ELSE 'direct' END;
BEGIN
  UPDATE public.submissions
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = p_event_id
    AND deleted_at IS NULL
    AND status IN ('aprovado', 'approved', 'published', 'publicado');

  INSERT INTO public.flyer_engagement_events (event_id, origin)
  SELECT s.id, v_origin
  FROM public.submissions s
  WHERE s.id = p_event_id
    AND s.image_url IS NOT NULL
    AND btrim(s.image_url) <> ''
    AND s.deleted_at IS NULL
    AND s.status IN ('aprovado', 'approved', 'published', 'publicado');
END;
$function$;

REVOKE ALL ON FUNCTION public.record_event_open(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_event_open(uuid, text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.intranet_engagement_funnel(
  p_start_at timestamptz,
  p_end_at timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
  v_start_day date;
  v_end_day date;
BEGIN
  IF NOT public.intranet_can_view() THEN
    RAISE EXCEPTION 'Acesso restrito à equipe de gestão' USING ERRCODE = '42501';
  END IF;

  IF p_start_at IS NULL OR p_end_at IS NULL OR p_end_at <= p_start_at OR p_end_at - p_start_at > interval '366 days' THEN
    RAISE EXCEPTION 'Período inválido';
  END IF;

  v_start_day := (p_start_at AT TIME ZONE 'America/Sao_Paulo')::date;
  v_end_day := ((p_end_at - interval '1 microsecond') AT TIME ZONE 'America/Sao_Paulo')::date;

  WITH days AS (
    SELECT generate_series(v_start_day, v_end_day, interval '1 day')::date AS day
  ),
  flyer_daily AS (
    SELECT (opened_at AT TIME ZONE 'America/Sao_Paulo')::date AS day, count(*)::integer AS total
    FROM public.flyer_engagement_events
    WHERE opened_at >= p_start_at AND opened_at < p_end_at
    GROUP BY 1
  ),
  campaign_daily AS (
    SELECT day, sum(opens)::integer AS total
    FROM public.intranet_campaign_daily
    WHERE day BETWEEN v_start_day AND v_end_day
    GROUP BY day
  ),
  lead_daily AS (
    SELECT (created_at AT TIME ZONE 'America/Sao_Paulo')::date AS day,
      count(*)::integer AS total,
      count(*) FILTER (WHERE stage IN ('proposta', 'ganho'))::integer AS conversions
    FROM public.intranet_leads
    WHERE created_at >= p_start_at AND created_at < p_end_at
    GROUP BY 1
  ),
  favorite_daily AS (
    SELECT (created_at AT TIME ZONE 'America/Sao_Paulo')::date AS day, count(*)::integer AS total
    FROM public.user_favorites
    WHERE created_at >= p_start_at AND created_at < p_end_at
    GROUP BY 1
  ),
  expense_daily AS (
    SELECT expense_date AS day, sum(amount_cents)::bigint AS total
    FROM public.finance_expenses
    WHERE expense_date BETWEEN v_start_day AND v_end_day AND category = 'marketing'
    GROUP BY 1
  ),
  daily AS (
    SELECT d.day::text AS name,
      coalesce(f.total, 0) AS flyer_opens,
      coalesce(c.total, 0) AS campaign_opens,
      coalesce(l.total, 0) AS leads,
      coalesce(l.conversions, 0) + coalesce(i.total, 0) AS interactions,
      coalesce(x.total, 0) AS investment_cents
    FROM days d
    LEFT JOIN flyer_daily f USING (day)
    LEFT JOIN campaign_daily c USING (day)
    LEFT JOIN lead_daily l USING (day)
    LEFT JOIN favorite_daily i USING (day)
    LEFT JOIN expense_daily x USING (day)
    ORDER BY d.day
  ),
  sources AS (
    SELECT source, sum(opens)::integer AS opens, sum(leads)::integer AS leads, sum(conversions)::integer AS conversions
    FROM (
      SELECT origin AS source, count(*)::integer AS opens, 0::integer AS leads, 0::integer AS conversions
      FROM public.flyer_engagement_events
      WHERE opened_at >= p_start_at AND opened_at < p_end_at
      GROUP BY origin
      UNION ALL
      SELECT origin, 0, count(*)::integer, count(*) FILTER (WHERE stage IN ('proposta', 'ganho'))::integer
      FROM public.intranet_leads
      WHERE created_at >= p_start_at AND created_at < p_end_at
      GROUP BY origin
    ) rows
    GROUP BY source
  ),
  totals AS (
    SELECT
      coalesce((SELECT sum(flyer_opens) FROM daily), 0)::integer AS flyer_opens,
      coalesce((SELECT sum(campaign_opens) FROM daily), 0)::integer AS campaign_opens,
      coalesce((SELECT sum(leads) FROM daily), 0)::integer AS leads,
      coalesce((SELECT sum(interactions) FROM daily), 0)::integer AS interactions,
      coalesce((SELECT sum(investment_cents) FROM daily), 0)::bigint AS investment_cents,
      coalesce((SELECT count(*) FROM public.user_favorites WHERE created_at >= p_start_at AND created_at < p_end_at), 0)::integer AS favorites,
      coalesce((SELECT count(*) FROM public.intranet_leads WHERE created_at >= p_start_at AND created_at < p_end_at AND stage IN ('proposta', 'ganho')), 0)::integer AS qualified_leads
  )
  SELECT jsonb_build_object(
    'summary', jsonb_build_object(
      'flyer_opens', totals.flyer_opens,
      'campaign_opens', totals.campaign_opens,
      'leads', totals.leads,
      'interactions', totals.interactions,
      'favorites', totals.favorites,
      'qualified_leads', totals.qualified_leads,
      'investment_cents', totals.investment_cents,
      'interaction_rate', CASE WHEN totals.flyer_opens = 0 THEN NULL ELSE round(totals.interactions::numeric * 100 / totals.flyer_opens, 1) END,
      'presence_collected', false
    ),
    'daily', coalesce((SELECT jsonb_agg(to_jsonb(d) ORDER BY d.name) FROM daily d), '[]'::jsonb),
    'sources', coalesce((SELECT jsonb_agg(jsonb_build_object(
      'source', s.source,
      'opens', s.opens,
      'leads', s.leads,
      'conversions', s.conversions,
      'conversion_rate', CASE WHEN s.opens = 0 THEN NULL ELSE round(s.conversions::numeric * 100 / s.opens, 1) END
    ) ORDER BY s.opens DESC, s.leads DESC) FROM sources s), '[]'::jsonb)
  ) INTO v_result
  FROM totals;

  RETURN v_result;
END;
$function$;

REVOKE ALL ON FUNCTION public.intranet_engagement_funnel(timestamptz, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.intranet_engagement_funnel(timestamptz, timestamptz) TO authenticated, service_role;