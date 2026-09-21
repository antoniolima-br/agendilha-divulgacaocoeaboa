DROP POLICY IF EXISTS "Gerenciar proprio evento" ON public.submissions;
DROP POLICY IF EXISTS "submissions_update_owner_admin_collab" ON public.submissions;

CREATE POLICY "submissions_update_owner_admin_collab"
ON public.submissions
FOR UPDATE
TO authenticated
USING (
  public.is_admin_or_master(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.collaborators c
    WHERE c.user_id = auth.uid()
      AND c.is_active = true
      AND (c.can_edit = true OR c.can_approve = true)
  )
  OR (
    user_id = auth.uid()
    AND public.can_create_events(auth.uid())
    AND status NOT IN ('aprovado', 'publicado', 'divulgado')
  )
)
WITH CHECK (
  public.is_admin_or_master(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.collaborators c
    WHERE c.user_id = auth.uid()
      AND c.is_active = true
      AND (c.can_edit = true OR c.can_approve = true)
  )
  OR (
    user_id = auth.uid()
    AND public.can_create_events(auth.uid())
    AND status NOT IN ('aprovado', 'publicado', 'divulgado')
  )
);