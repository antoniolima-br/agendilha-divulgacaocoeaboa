DROP POLICY IF EXISTS app_settings_public_allowlist_read ON public.app_settings;
CREATE POLICY app_settings_public_allowlist_read ON public.app_settings FOR SELECT TO anon, authenticated
USING (key = ANY (ARRAY['team_whatsapp','team_contact_name','destaque_evento_titulo','destaque_evento_texto','destaque_anuncio_titulo','destaque_anuncio_texto','destaque_cta','live_overrides','home_video_url','home_video_url_2','home_video_url_3','home_video_cover_url','home_video_title','home_publi_1','home_publi_2','home_publi_3']));

CREATE OR REPLACE FUNCTION public.set_home_publi_slot(p_slot int, p_url text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.intranet_is_director(auth.uid()) THEN
    RAISE EXCEPTION 'Sem permissão' USING ERRCODE = '42501';
  END IF;
  IF p_slot NOT IN (1,2,3) THEN RAISE EXCEPTION 'Espaço de anúncio inválido'; END IF;
  IF coalesce(p_url,'') <> '' AND p_url !~* '^storage:publi/' THEN RAISE EXCEPTION 'Imagem inválida'; END IF;
  IF length(coalesce(p_url,'')) > 300 THEN RAISE EXCEPTION 'Caminho grande demais'; END IF;
  INSERT INTO public.app_settings(key, value) VALUES ('home_publi_' || p_slot, coalesce(trim(p_url),''))
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
END $$;
REVOKE ALL ON FUNCTION public.set_home_publi_slot(int,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_home_publi_slot(int,text) TO authenticated;