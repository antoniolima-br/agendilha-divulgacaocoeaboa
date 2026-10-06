CREATE OR REPLACE VIEW public.public_submissions WITH (security_invoker = false) AS
 SELECT id, user_id, company_name, event_title, date, start_time, end_time, location, description, video_link, category, created_at,
    address_street, address_number, address_neighborhood, address_city, address_state, address_zip, promotion_type, target_audience,
    promotion_rules, additional_details, status, sale_price,
    NULL::text AS maintenance_cost, subscription_info, NULL::text AS commission, stage, concept_description,
    deleted_at, NULL::text AS rejection_reason, predicted_duration, atrativo_name, atrativo_type, atrativo_style, location_type, legal_acceptance,
    legal_acceptance_date, is_highlight, views_count, shares_count, image_url, latitude, longitude, age_rating, is_suitable_for_minors,
    report_count, moderation_status, artist_id, NULL::double precision AS ai_moderation_score, NULL::text[] AS ai_moderation_labels,
    image_url_story, image_url_whatsapp, slug,
    short_copy, long_copy, approved_at, NULL::uuid AS approved_by, published_at, fotos, duvidas_source,
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