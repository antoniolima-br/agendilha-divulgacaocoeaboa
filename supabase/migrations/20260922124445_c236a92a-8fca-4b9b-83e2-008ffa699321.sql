CREATE OR REPLACE FUNCTION public.notify_ad_owner_on_publication()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'publicado' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.app_notifications (
      user_id,
      type,
      title,
      body,
      link,
      entity_table,
      entity_id
    )
    VALUES (
      NEW.user_id,
      'ad_published',
      'Seu anúncio foi publicado',
      COALESCE(NEW.title, 'Seu anúncio') || ' já está no ar no AgendIlha.',
      '/meus-anuncios',
      'ads',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_ad_owner_on_publication() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_notify_ad_owner_on_publication ON public.ads;
CREATE TRIGGER trg_notify_ad_owner_on_publication
AFTER UPDATE OF status ON public.ads
FOR EACH ROW
EXECUTE FUNCTION public.notify_ad_owner_on_publication();