CREATE OR REPLACE FUNCTION public.require_event_title_for_publication()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
BEGIN
  IF nullif(btrim(NEW.event_title), '') IS NULL
     AND (
       (TG_OP = 'INSERT' AND (NEW.status IN ('aprovado','approved','publicado','published') OR NEW.published_at IS NOT NULL))
       OR (TG_OP = 'UPDATE' AND (
         (NEW.status IN ('aprovado','approved','publicado','published') AND OLD.status IS DISTINCT FROM NEW.status)
         OR (NEW.published_at IS NOT NULL AND OLD.published_at IS NULL)
       ))
     ) THEN
    RAISE EXCEPTION 'Preencha o título do rolê antes de aprovar ou publicar';
  END IF;
  RETURN NEW;
END
$$;
REVOKE ALL ON FUNCTION public.require_event_title_for_publication() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.require_event_title_for_publication() TO service_role;

DROP TRIGGER IF EXISTS require_event_title_for_publication ON public.submissions;
CREATE TRIGGER require_event_title_for_publication
BEFORE INSERT OR UPDATE ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.require_event_title_for_publication();

CREATE OR REPLACE FUNCTION public.intranet_set_curation_status(p_id uuid, p_action text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
DECLARE
  v_status text;
  v_now timestamptz := now();
BEGIN
  IF NOT public.intranet_can_edit_sector('administracao') THEN
    RAISE EXCEPTION 'Ação restrita ao Master' USING ERRCODE='42501';
  END IF;
  IF p_action NOT IN ('approve','reject','suspend') THEN
    RAISE EXCEPTION 'Ação de Curadoria inválida';
  END IF;
  IF p_action='approve' AND EXISTS(
    SELECT 1 FROM public.submissions
    WHERE id=p_id AND nullif(btrim(event_title),'') IS NULL
  ) THEN
    RAISE EXCEPTION 'Preencha o título do rolê antes de aprovar';
  END IF;
  IF p_action='approve' AND EXISTS(
    SELECT 1 FROM public.submissions
    WHERE id=p_id AND promotion_choice='highlight'
      AND highlight_grant_type IS DISTINCT FROM 'courtesy'
  ) THEN
    RAISE EXCEPTION 'Patrocinado: registre a baixa no Financeiro antes de liberar';
  END IF;

  v_status := CASE p_action
    WHEN 'approve' THEN 'aprovado'
    WHEN 'reject' THEN 'rejeitado'
    ELSE 'cancelado'
  END;

  PERFORM set_config('app.intranet_moderation','yes',true);
  UPDATE public.submissions
     SET status=v_status,
         approved_at=CASE WHEN p_action='approve' THEN v_now ELSE approved_at END,
         approved_by=CASE WHEN p_action='approve' THEN auth.uid() ELSE approved_by END,
         published_at=CASE WHEN p_action='approve' THEN coalesce(published_at,v_now) ELSE published_at END,
         rejected_at=CASE WHEN p_action='reject' THEN v_now ELSE rejected_at END,
         rejected_by=CASE WHEN p_action='reject' THEN auth.uid() ELSE rejected_by END,
         moderation_status=CASE WHEN p_action='approve' THEN 'approved' WHEN p_action='reject' THEN 'blocked' ELSE 'pending_review' END,
         highlight_hidden=CASE WHEN p_action='suspend' THEN true WHEN p_action='approve' THEN false ELSE highlight_hidden END
   WHERE id=p_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rolê não encontrado';
  END IF;

  INSERT INTO public.event_audit_log(event_id, actor_id, action, new_value)
  VALUES (p_id, auth.uid(), 'curation_' || p_action, jsonb_build_object('status',v_status));

  RETURN jsonb_build_object('id',p_id,'status',v_status);
END
$$;
REVOKE ALL ON FUNCTION public.intranet_set_curation_status(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.intranet_set_curation_status(uuid,text) TO authenticated, service_role;