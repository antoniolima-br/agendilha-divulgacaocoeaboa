CREATE OR REPLACE FUNCTION public.intranet_can_view()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path=public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND public.has_role(auth.uid(), 'master')
$$;
REVOKE ALL ON FUNCTION public.intranet_can_view() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.intranet_can_view() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.intranet_can_edit_sector(p_sector text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path=public
AS $$
  SELECT p_sector IN ('comercial','marketing','administracao','financeiro','desenvolvimento')
    AND public.intranet_can_view()
$$;
REVOKE ALL ON FUNCTION public.intranet_can_edit_sector(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.intranet_can_edit_sector(text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.intranet_can_access(p_sector text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path=public
AS $$
  SELECT p_sector IN ('comercial','marketing','administracao','financeiro','desenvolvimento')
    AND public.intranet_can_view()
$$;
REVOKE ALL ON FUNCTION public.intranet_can_access(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.intranet_can_access(text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.can_read_finance(p_user uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path=public
AS $$
  SELECT p_user IS NOT NULL
    AND p_user=auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id=p_user
        AND role::text IN ('admin','senior','financeiro','master')
    )
$$;
REVOKE ALL ON FUNCTION public.can_read_finance(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_read_finance(uuid) TO authenticated, service_role;

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
         highlight_hidden=CASE WHEN p_action='suspend' THEN true ELSE highlight_hidden END
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

COMMENT ON FUNCTION public.intranet_can_view() IS 'Master-only gate for the hidden sector management workspace.';
COMMENT ON FUNCTION public.intranet_set_curation_status(uuid,text) IS 'Master-only curation decision: approve, reject, or suspend without deleting the event.';