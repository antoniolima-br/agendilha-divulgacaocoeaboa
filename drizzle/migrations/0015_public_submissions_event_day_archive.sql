CREATE OR REPLACE FUNCTION public.event_day_sp(p_date text)
RETURNS date
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE v text := btrim(coalesce(p_date, ''));
BEGIN
  IF v = '' THEN RETURN NULL; END IF;
  IF v ~ '^\d{4}-\d{2}-\d{2}$' THEN RETURN v::date; END IF;
  IF v ~ '^\d{2}/\d{2}/\d{4}$' THEN RETURN to_date(v, 'DD/MM/YYYY'); END IF;
  RETURN (v::timestamptz AT TIME ZONE 'America/Sao_Paulo')::date;
EXCEPTION WHEN others THEN
  RETURN NULL;
END;
$$;
GRANT EXECUTE ON FUNCTION public.event_day_sp(text) TO anon, authenticated, service_role;

CREATE OR REPLACE VIEW public.public_submissions WITH (security_invoker = false) AS
 SELECT id, user_id, company_name, event_title, date, start_time, end_time, location, description, video_link, category, created_at,
    address_street, address_number, address_neighborhood, address_city, address_state, address_zip, promotion_type, target_audience,
    promotion_rules, additional_details, status, sale_price, maintenance_cost, subscription_info, commission, stage, concept_description,
    deleted_at, rejection_reason, predicted_duration, atrativo_name, atrativo_type, atrativo_style, location_type, legal_acceptance,
    legal_acceptance_date, is_highlight, views_count, shares_count, image_url, latitude, longitude, age_rating, is_suitable_for_minors,
    report_count, moderation_status, artist_id, ai_moderation_score, ai_moderation_labels, image_url_story, image_url_whatsapp, slug,
    short_copy, long_copy, approved_at, approved_by, published_at, fotos, duvidas_source,
    COALESCE(responsavel_duvidas_whatsapp,
        CASE duvidas_source
            WHEN 'atrativo'::text THEN atrativo_contact
            WHEN 'estabelecimento'::text THEN location_contact
            ELSE phone
        END) AS duvidas_phone,
    responsavel_duvidas_whatsapp, highlight_until, highlight_hidden,
    is_highlight AND NOT highlight_hidden AND (highlight_until IS NULL OR highlight_until > now()) AS highlight_active,
    is_free,
    public.event_day_sp(date) AS event_day,
    (public.event_day_sp(date) IS NULL OR public.event_day_sp(date) < (now() AT TIME ZONE 'America/Sao_Paulo')::date) AS is_archived
   FROM submissions
  WHERE deleted_at IS NULL AND status = ANY (ARRAY['aprovado'::text, 'publicado'::text, 'divulgado'::text]);
GRANT SELECT ON public.public_submissions TO anon, authenticated;