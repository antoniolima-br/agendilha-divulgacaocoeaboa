DROP POLICY IF EXISTS app_settings_public_allowlist_read ON public.app_settings;
CREATE POLICY app_settings_public_allowlist_read ON public.app_settings FOR SELECT TO anon, authenticated
USING (key = ANY (ARRAY['team_whatsapp','team_contact_name','destaque_evento_titulo','destaque_evento_texto','destaque_anuncio_titulo','destaque_anuncio_texto','destaque_cta','live_overrides','home_video_url','home_video_url_2','home_video_url_3','home_video_cover_url','home_video_title']));

CREATE OR REPLACE FUNCTION public.set_home_video_slot(p_slot int, p_url text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE k text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.intranet_is_director(auth.uid()) THEN
    RAISE EXCEPTION 'Sem permissão' USING ERRCODE = '42501';
  END IF;
  IF p_slot NOT IN (1,2,3) THEN RAISE EXCEPTION 'Espaço de vídeo inválido'; END IF;
  IF coalesce(p_url,'') <> '' AND p_url !~* '^(https://|storage:)' THEN RAISE EXCEPTION 'O link do vídeo precisa começar com https://'; END IF;
  IF length(coalesce(p_url,'')) > 500 THEN RAISE EXCEPTION 'Link grande demais'; END IF;
  k := CASE p_slot WHEN 1 THEN 'home_video_url' ELSE 'home_video_url_' || p_slot END;
  INSERT INTO public.app_settings(key, value) VALUES (k, coalesce(trim(p_url),''))
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
END $$;
REVOKE ALL ON FUNCTION public.set_home_video_slot(int,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_home_video_slot(int,text) TO authenticated;