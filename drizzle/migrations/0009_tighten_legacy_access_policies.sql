DROP POLICY IF EXISTS "Authenticated can read templates" ON public.whatsapp_templates;
CREATE POLICY "Moderation teams can read templates"
ON public.whatsapp_templates
FOR SELECT
TO authenticated
USING (
  public.is_admin_or_master(auth.uid())
  OR public.has_role(auth.uid(), 'senior'::public.app_role)
  OR EXISTS (
    SELECT 1
    FROM public.collaborators c
    WHERE c.user_id = auth.uid()
      AND c.is_active = true
      AND c.can_approve = true
  )
);

DROP POLICY IF EXISTS "Perms viewable by authenticated" ON public.app_permissions;
DROP POLICY IF EXISTS "Role perms viewable by authenticated" ON public.app_role_permissions;
DROP POLICY IF EXISTS "Roles viewable by authenticated" ON public.app_roles;

CREATE POLICY "Only masters can view deprecated permissions"
ON public.app_permissions
FOR SELECT
TO authenticated
USING (public.is_master(auth.uid()));

CREATE POLICY "Only masters can view deprecated role permissions"
ON public.app_role_permissions
FOR SELECT
TO authenticated
USING (public.is_master(auth.uid()));

CREATE POLICY "Only masters can view deprecated roles"
ON public.app_roles
FOR SELECT
TO authenticated
USING (public.is_master(auth.uid()));

DROP POLICY IF EXISTS "Usuários autenticados podem sugerir locais" ON public.places;
CREATE POLICY "Staff can suggest legacy locations"
ON public.places
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin_or_master(auth.uid())
  OR public.has_role(auth.uid(), 'senior'::public.app_role)
  OR EXISTS (
    SELECT 1
    FROM public.collaborators c
    WHERE c.user_id = auth.uid()
      AND c.is_active = true
      AND c.can_edit = true
  )
);

CREATE OR REPLACE VIEW public.public_submissions
WITH (security_invoker = true)
AS
SELECT id,
    user_id,
    company_name,
    event_title,
    date,
    start_time,
    end_time,
    location,
    description,
    video_link,
    category,
    created_at,
    address_street,
    address_number,
    address_neighborhood,
    address_city,
    address_state,
    address_zip,
    promotion_type,
    target_audience,
    promotion_rules,
    additional_details,
    status,
    sale_price,
    maintenance_cost,
    subscription_info,
    commission,
    stage,
    concept_description,
    deleted_at,
    rejection_reason,
    predicted_duration,
    atrativo_name,
    atrativo_type,
    atrativo_style,
    location_type,
    legal_acceptance,
    legal_acceptance_date,
    is_highlight,
    views_count,
    shares_count,
    image_url,
    latitude,
    longitude,
    age_rating,
    is_suitable_for_minors,
    report_count,
    moderation_status,
    artist_id,
    ai_moderation_score,
    ai_moderation_labels,
    image_url_story,
    image_url_whatsapp,
    slug,
    short_copy,
    long_copy,
    approved_at,
    approved_by,
    published_at,
    fotos,
    duvidas_source,
    COALESCE(responsavel_duvidas_whatsapp,
      CASE duvidas_source
        WHEN 'atrativo' THEN atrativo_contact
        WHEN 'estabelecimento' THEN location_contact
        ELSE phone
      END) AS duvidas_phone,
    responsavel_duvidas_whatsapp,
    highlight_until,
    highlight_hidden,
    (is_highlight AND NOT highlight_hidden AND (highlight_until IS NULL OR highlight_until > now())) AS highlight_active,
    is_free
FROM public.submissions
WHERE deleted_at IS NULL
  AND status = ANY (ARRAY['aprovado'::text, 'publicado'::text, 'divulgado'::text]);

GRANT SELECT ON public.public_submissions TO anon, authenticated;
GRANT ALL ON public.public_submissions TO service_role;