CREATE OR REPLACE FUNCTION public.intranet_members()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path=public
AS $$
BEGIN
  IF NOT public.is_master(auth.uid()) THEN
    RAISE EXCEPTION 'Somente Master gerencia acessos' USING ERRCODE='42501';
  END IF;

  RETURN (
    SELECT coalesce(jsonb_agg(to_jsonb(member) ORDER BY member.name), '[]'::jsonb)
    FROM (
      SELECT
        p.user_id AS id,
        coalesce(p.responsible_name, 'Sem nome') AS name,
        ARRAY(
          SELECT ur.role::text
          FROM public.user_roles ur
          WHERE ur.user_id = p.user_id
          ORDER BY ur.role::text
        ) AS roles
      FROM public.profiles p
      WHERE EXISTS (
        SELECT 1
        FROM public.user_roles ur
        WHERE ur.user_id = p.user_id
          AND ur.role::text IN ('master','senior','admin','comercial','marketing','administracao','financeiro','desenvolvimento')
      )
    ) AS member
  );
END
$$;
REVOKE ALL ON FUNCTION public.intranet_members() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.intranet_members() TO authenticated, service_role;
COMMENT ON FUNCTION public.intranet_members() IS 'Master-only administrative team directory; public users and non-administrative profiles are excluded.';