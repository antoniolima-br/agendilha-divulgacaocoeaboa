CREATE POLICY submissions_post_approval_update_lock ON public.submissions AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.is_admin_or_master(auth.uid()) OR (public.can_write_finance(auth.uid()) AND (highlight_grant_type = 'paid' OR promotion_choice = 'highlight')) OR (user_id = auth.uid() AND public.can_create_events(auth.uid()) AND deleted_at IS NULL AND approved_at IS NULL AND published_at IS NULL AND status IN ('rascunho','draft','pendente','pending','em_revisao','recebido','rejeitado','rejected'))) WITH CHECK (public.is_admin_or_master(auth.uid()) OR (public.can_write_finance(auth.uid()) AND (highlight_grant_type = 'paid' OR promotion_choice = 'highlight')) OR (user_id = auth.uid() AND public.can_create_events(auth.uid()) AND deleted_at IS NULL AND approved_at IS NULL AND published_at IS NULL AND status IN ('rascunho','draft','pendente','pending','em_revisao','recebido','rejeitado','rejected')));
CREATE POLICY submissions_post_approval_delete_lock ON public.submissions AS RESTRICTIVE FOR DELETE TO authenticated USING (public.is_admin_or_master(auth.uid()) OR (user_id = auth.uid() AND approved_at IS NULL AND published_at IS NULL AND status IN ('rascunho','draft','pendente','pending','em_revisao','recebido','rejeitado','rejected')));
CREATE OR REPLACE FUNCTION public.guard_approved_event_content() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF coalesce(auth.role(),'') = 'service_role' OR auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF OLD.approved_at IS NOT NULL AND NEW.approved_at IS NULL THEN NEW.approved_at := OLD.approved_at; END IF;
  IF OLD.published_at IS NOT NULL AND NEW.published_at IS NULL THEN NEW.published_at := OLD.published_at; END IF;
  IF public.is_admin_or_master(auth.uid()) THEN RETURN NEW; END IF;
  IF OLD.approved_at IS NOT NULL OR OLD.published_at IS NOT NULL OR OLD.status IN ('aprovado','approved','publicado','published','divulgado','suspenso','suspended','cancelado') THEN
    IF ROW(NEW.event_title,NEW.date,NEW.start_time,NEW.end_time,NEW.location,NEW.description,NEW.image_url,NEW.image_url_story,NEW.image_url_whatsapp,NEW.address_street,NEW.address_number,NEW.address_neighborhood,NEW.address_city,NEW.address_state,NEW.address_zip,NEW.category,NEW.video_link,NEW.atrativo_name,NEW.artist_id,NEW.atrativo_id,NEW.estabelecimento_id,NEW.user_id,NEW.deleted_at) IS DISTINCT FROM ROW(OLD.event_title,OLD.date,OLD.start_time,OLD.end_time,OLD.location,OLD.description,OLD.image_url,OLD.image_url_story,OLD.image_url_whatsapp,OLD.address_street,OLD.address_number,OLD.address_neighborhood,OLD.address_city,OLD.address_state,OLD.address_zip,OLD.category,OLD.video_link,OLD.atrativo_name,OLD.artist_id,OLD.atrativo_id,OLD.estabelecimento_id,OLD.user_id,OLD.deleted_at) THEN
      RAISE EXCEPTION 'Alterações após aprovação são exclusivas da Curadoria.' USING ERRCODE='42501';
    END IF;
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.guard_approved_event_content() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.guard_approved_event_content() TO service_role;
CREATE TRIGGER aaaa_guard_approved_event_content BEFORE UPDATE ON public.submissions FOR EACH ROW EXECUTE FUNCTION public.guard_approved_event_content();