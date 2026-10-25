DROP POLICY IF EXISTS app_settings_public_allowlist_read ON public.app_settings;
CREATE POLICY app_settings_public_allowlist_read ON public.app_settings FOR SELECT TO anon, authenticated
USING (key = ANY (ARRAY['team_whatsapp','team_contact_name','destaque_evento_titulo','destaque_evento_texto','destaque_anuncio_titulo','destaque_anuncio_texto','destaque_cta','live_overrides','home_video_url','home_video_cover_url','home_video_title']));

CREATE OR REPLACE FUNCTION public.set_home_video(p_url text, p_cover text, p_title text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.intranet_is_director(auth.uid()) THEN
    RAISE EXCEPTION 'Sem permissão' USING ERRCODE = '42501';
  END IF;
  IF coalesce(p_url,'') <> '' AND p_url !~* '^https://' THEN RAISE EXCEPTION 'O link do vídeo precisa começar com https://'; END IF;
  IF coalesce(p_cover,'') <> '' AND p_cover !~* '^https://' THEN RAISE EXCEPTION 'O link da capa precisa começar com https://'; END IF;
  IF length(coalesce(p_url,'')) > 500 OR length(coalesce(p_cover,'')) > 500 OR length(coalesce(p_title,'')) > 120 THEN RAISE EXCEPTION 'Texto grande demais'; END IF;
  INSERT INTO public.app_settings(key, value) VALUES
    ('home_video_url', coalesce(trim(p_url),'')),
    ('home_video_cover_url', coalesce(trim(p_cover),'')),
    ('home_video_title', coalesce(trim(p_title),''))
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
END $$;
REVOKE ALL ON FUNCTION public.set_home_video(text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_home_video(text,text,text) TO authenticated;