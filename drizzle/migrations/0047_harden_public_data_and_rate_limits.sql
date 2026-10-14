CREATE TABLE public.public_request_limits (
  scope text NOT NULL,
  fingerprint text NOT NULL,
  window_started_at timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 1 CHECK (request_count > 0),
  PRIMARY KEY (scope, fingerprint)
);

GRANT ALL ON public.public_request_limits TO service_role;
ALTER TABLE public.public_request_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.consume_public_rate_limit(
  p_scope text,
  p_fingerprint text,
  p_limit integer,
  p_window interval
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_count integer;
BEGIN
  IF p_scope IS NULL OR p_scope !~ '^[a-z0-9_:-]{1,64}$'
     OR p_fingerprint IS NULL OR p_fingerprint !~ '^[a-f0-9]{64}$'
     OR p_limit NOT BETWEEN 1 AND 100
     OR p_window < interval '1 minute'
     OR p_window > interval '1 day' THEN
    RETURN false;
  END IF;

  INSERT INTO public.public_request_limits(scope, fingerprint, window_started_at, request_count)
  VALUES (p_scope, p_fingerprint, v_now, 1)
  ON CONFLICT (scope, fingerprint) DO UPDATE
  SET window_started_at = CASE
        WHEN public.public_request_limits.window_started_at <= v_now - p_window THEN v_now
        ELSE public.public_request_limits.window_started_at
      END,
      request_count = CASE
        WHEN public.public_request_limits.window_started_at <= v_now - p_window THEN 1
        ELSE public.public_request_limits.request_count + 1
      END
  RETURNING request_count INTO v_count;

  RETURN v_count <= p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_public_submission_quota(p_fingerprint text)
RETURNS boolean
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.consume_public_rate_limit('public_submission', p_fingerprint, 5, interval '15 minutes')
$$;

CREATE OR REPLACE FUNCTION public.consume_coezinho_quota(p_fingerprint text)
RETURNS boolean
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.consume_public_rate_limit('coezinho', p_fingerprint, 30, interval '10 minutes')
$$;

REVOKE ALL ON FUNCTION public.consume_public_rate_limit(text,text,integer,interval) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_public_rate_limit(text,text,integer,interval) TO service_role;
REVOKE ALL ON FUNCTION public.consume_public_submission_quota(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_public_submission_quota(text) TO service_role;
REVOKE ALL ON FUNCTION public.consume_coezinho_quota(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_coezinho_quota(text) TO service_role;

DROP POLICY IF EXISTS ad_photos_public_read ON storage.objects;
CREATE POLICY ad_photos_published_or_owner_read
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'ad-photos'
  AND (
    (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text)
    OR EXISTS (
      SELECT 1
      FROM public.ads a
      WHERE a.status = 'publicado'
        AND name = ANY(a.photos)
    )
  )
);

DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.event_reviews;
CREATE POLICY event_reviews_public_approved_read
ON public.event_reviews
FOR SELECT
TO anon, authenticated
USING (status = 'approved');

DROP POLICY IF EXISTS app_settings_public_read ON public.app_settings;
CREATE POLICY app_settings_public_allowlist_read
ON public.app_settings
FOR SELECT
TO anon, authenticated
USING (key = ANY (ARRAY[
  'team_whatsapp',
  'team_contact_name',
  'destaque_evento_titulo',
  'destaque_evento_texto',
  'destaque_anuncio_titulo',
  'destaque_anuncio_texto',
  'destaque_cta',
  'live_overrides'
]));

REVOKE SELECT ON public.divulgador_requests FROM anon;

ALTER VIEW public.atrativos_public SET (security_invoker = true);
ALTER VIEW public.estabelecimentos_public SET (security_invoker = true);
ALTER VIEW public.public_submissions SET (security_invoker = true);

REVOKE EXECUTE ON FUNCTION public.check_attraction_schedule(uuid,uuid,text,text,text,text,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_attraction_schedule(uuid,uuid,text,text,text,text,uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.intranet_flyer_engagement(timestamptz,timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.intranet_flyer_engagement(timestamptz,timestamptz) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.has_permission(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid,text) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid,public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid,public.app_role) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid,text) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.is_admin_or_master(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin_or_master(uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.is_master(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_master(uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.is_promotor(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_promotor(uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.guard_ad_campaign_configuration() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guard_ad_campaign_configuration() TO service_role;
REVOKE EXECUTE ON FUNCTION public.owns_artist_media_path(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owns_artist_media_path(text) TO authenticated, service_role;

CREATE INDEX IF NOT EXISTS idx_ads_highlight_plan_id ON public.ads(highlight_plan_id);
CREATE INDEX IF NOT EXISTS idx_ads_product_id ON public.ads(product_id);
CREATE INDEX IF NOT EXISTS idx_app_role_permissions_permission_id ON public.app_role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_app_user_roles_role_id ON public.app_user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_artistas_contato_id ON public.artistas(contato_id);
CREATE INDEX IF NOT EXISTS idx_divulgadores_contato_id ON public.divulgadores(contato_id);
CREATE INDEX IF NOT EXISTS idx_submissions_highlight_package_id ON public.submissions(highlight_package_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_publicos_contato_id ON public.usuarios_publicos(contato_id);

COMMENT ON TABLE public.public_request_limits IS 'Server-only fixed-window abuse protection for public Edge Functions; stores one-way request fingerprints, never raw IP addresses.';