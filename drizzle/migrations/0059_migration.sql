-- Temporary/crossed sector edit grants managed by Sênior/Master
CREATE TABLE public.intranet_edit_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  sector text NOT NULL CHECK (sector IN ('comercial','marketing','administracao','financeiro','desenvolvimento')),
  expires_at timestamptz,
  granted_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, sector)
);
GRANT SELECT ON public.intranet_edit_grants TO authenticated;
GRANT ALL ON public.intranet_edit_grants TO service_role;
ALTER TABLE public.intranet_edit_grants ENABLE ROW LEVEL SECURITY;
CREATE POLICY edit_grants_read ON public.intranet_edit_grants FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'master') OR public.has_role(auth.uid(),'senior'));

CREATE OR REPLACE FUNCTION public.intranet_is_director(p_user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT p_user IS NOT NULL AND EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=p_user AND role::text IN ('master','senior'))
$$;

-- Read: every partner on the administrative team (directors + sector holders)
CREATE OR REPLACE FUNCTION public.intranet_can_view()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS(
    SELECT 1 FROM public.user_roles WHERE user_id=auth.uid()
      AND role::text IN ('master','senior','comercial','marketing','administracao','financeiro','desenvolvimento'))
$$;

-- Write: directors everywhere; otherwise only the sector holder or an active grant
CREATE OR REPLACE FUNCTION public.intranet_can_edit_sector(p_sector text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT p_sector IN ('comercial','marketing','administracao','financeiro','desenvolvimento')
    AND auth.uid() IS NOT NULL
    AND (
      public.intranet_is_director(auth.uid())
      OR EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role::text=p_sector)
      OR EXISTS(SELECT 1 FROM public.intranet_edit_grants g WHERE g.user_id=auth.uid() AND g.sector=p_sector AND (g.expires_at IS NULL OR g.expires_at>now()))
    )
$$;

-- Moderation is a write: require edit rights on Curadoria
CREATE OR REPLACE FUNCTION public.intranet_moderate(p_id uuid, p_approve boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$ DECLARE v_status text; v_target text:=CASE WHEN p_approve THEN 'aprovado' ELSE 'rejeitado' END; BEGIN
IF NOT public.intranet_can_edit_sector('administracao') THEN RAISE EXCEPTION 'Edição restrita ao responsável pela Curadoria' USING ERRCODE='42501'; END IF;
IF p_approve AND EXISTS(SELECT 1 FROM public.submissions WHERE id=p_id AND promotion_choice='highlight' AND highlight_grant_type IS DISTINCT FROM 'courtesy') THEN RAISE EXCEPTION 'Patrocinado: registre a baixa no Financeiro antes de liberar'; END IF;
PERFORM set_config('app.intranet_moderation','yes',true);
UPDATE public.submissions SET status=v_target,approved_at=CASE WHEN p_approve THEN now() ELSE NULL END,approved_by=CASE WHEN p_approve THEN auth.uid() ELSE NULL END,rejected_at=CASE WHEN NOT p_approve THEN now() ELSE NULL END,rejected_by=CASE WHEN NOT p_approve THEN auth.uid() ELSE NULL END WHERE id=p_id AND status='pendente' AND deleted_at IS NULL RETURNING status INTO v_status;
IF v_status IS DISTINCT FROM v_target THEN RAISE EXCEPTION 'O evento já foi revisado ou a alteração não foi autorizada'; END IF; RETURN jsonb_build_object('success',true); END $function$;

-- Directors (Sênior/Master) name sector holders
CREATE OR REPLACE FUNCTION public.intranet_assign_sector(p_user uuid, p_sector text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$ BEGIN
IF NOT public.intranet_is_director(auth.uid()) OR p_user=auth.uid() THEN RAISE EXCEPTION 'Somente Sênior ou Master altera acessos de outras contas' USING ERRCODE='42501'; END IF;
IF p_sector NOT IN ('comercial','marketing','administracao','financeiro','desenvolvimento','nenhum') THEN RAISE EXCEPTION 'Setor inválido'; END IF;
PERFORM pg_advisory_xact_lock(hashtextextended('intranet-role:'||p_user::text,0));
IF public.intranet_is_director(p_user) THEN RAISE EXCEPTION 'Preserve o acesso gerencial desta conta'; END IF;
IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE user_id=p_user) THEN RAISE EXCEPTION 'Conta não encontrada'; END IF;
DELETE FROM public.user_roles WHERE user_id=p_user AND role::text IN ('admin','comercial','marketing','administracao','financeiro','desenvolvimento');
IF p_sector<>'nenhum' THEN INSERT INTO public.user_roles(user_id,role) VALUES(p_user,p_sector::public.app_role) ON CONFLICT(user_id,role) DO NOTHING; END IF; END $function$;

-- Directors grant or revoke temporary/crossed edit rights
CREATE OR REPLACE FUNCTION public.intranet_set_edit_grant(p_user uuid, p_sector text, p_days integer, p_revoke boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$ BEGIN
IF NOT public.intranet_is_director(auth.uid()) OR p_user=auth.uid() THEN RAISE EXCEPTION 'Somente Sênior ou Master concede edição a outras contas' USING ERRCODE='42501'; END IF;
IF p_sector NOT IN ('comercial','marketing','administracao','financeiro','desenvolvimento') THEN RAISE EXCEPTION 'Setor inválido'; END IF;
IF p_revoke THEN DELETE FROM public.intranet_edit_grants WHERE user_id=p_user AND sector=p_sector; RETURN; END IF;
IF p_days IS NOT NULL AND (p_days<1 OR p_days>365) THEN RAISE EXCEPTION 'Prazo inválido'; END IF;
IF NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=p_user AND role::text IN ('comercial','marketing','administracao','financeiro','desenvolvimento')) THEN RAISE EXCEPTION 'Conta fora da equipe de sócios'; END IF;
INSERT INTO public.intranet_edit_grants(user_id,sector,expires_at,granted_by)
VALUES(p_user,p_sector,CASE WHEN p_days IS NULL THEN NULL ELSE now()+make_interval(days=>p_days) END,auth.uid())
ON CONFLICT(user_id,sector) DO UPDATE SET expires_at=excluded.expires_at,granted_by=auth.uid(),created_at=now(); END $function$;

-- Member list for directors, with active grants
CREATE OR REPLACE FUNCTION public.intranet_members()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  IF NOT public.intranet_is_director(auth.uid()) THEN RAISE EXCEPTION 'Somente Sênior ou Master gerencia acessos' USING ERRCODE='42501'; END IF;
  RETURN (SELECT coalesce(jsonb_agg(to_jsonb(m) ORDER BY m.name),'[]'::jsonb) FROM (
    SELECT p.user_id AS id, coalesce(p.responsible_name,'Sem nome') AS name,
      ARRAY(SELECT ur.role::text FROM public.user_roles ur WHERE ur.user_id=p.user_id ORDER BY 1) AS roles,
      coalesce((SELECT jsonb_agg(jsonb_build_object('sector',g.sector,'expires_at',g.expires_at)) FROM public.intranet_edit_grants g WHERE g.user_id=p.user_id AND (g.expires_at IS NULL OR g.expires_at>now())),'[]'::jsonb) AS grants
    FROM public.profiles p
    WHERE EXISTS(SELECT 1 FROM public.user_roles ur WHERE ur.user_id=p.user_id AND ur.role::text IN ('master','senior','admin','comercial','marketing','administracao','financeiro','desenvolvimento'))
  ) m);
END $function$;

REVOKE ALL ON FUNCTION public.intranet_set_edit_grant(uuid,text,integer,boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.intranet_set_edit_grant(uuid,text,integer,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.intranet_is_director(uuid) TO authenticated;