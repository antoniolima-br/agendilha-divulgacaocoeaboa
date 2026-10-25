CREATE POLICY home_videos_public_read ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'home-videos');
CREATE POLICY home_videos_director_insert ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'home-videos' AND public.intranet_is_director(auth.uid()));
CREATE POLICY home_videos_director_delete ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'home-videos' AND public.intranet_is_director(auth.uid()));

CREATE OR REPLACE FUNCTION public.set_home_video(p_url text, p_cover text, p_title text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.intranet_is_director(auth.uid()) THEN
    RAISE EXCEPTION 'Sem permissão' USING ERRCODE = '42501';
  END IF;
  IF coalesce(p_url,'') <> '' AND p_url !~* '^(https://|storage:)' THEN RAISE EXCEPTION 'O link do vídeo precisa começar com https://'; END IF;
  IF coalesce(p_cover,'') <> '' AND p_cover !~* '^(https://|storage:)' THEN RAISE EXCEPTION 'O link da capa precisa começar com https://'; END IF;
  IF length(coalesce(p_url,'')) > 500 OR length(coalesce(p_cover,'')) > 500 OR length(coalesce(p_title,'')) > 120 THEN RAISE EXCEPTION 'Texto grande demais'; END IF;
  INSERT INTO public.app_settings(key, value) VALUES
    ('home_video_url', coalesce(trim(p_url),'')),
    ('home_video_cover_url', coalesce(trim(p_cover),'')),
    ('home_video_title', coalesce(trim(p_title),''))
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
END $$;