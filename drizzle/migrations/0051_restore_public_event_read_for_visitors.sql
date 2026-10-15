GRANT SELECT ON public.public_submissions TO anon, authenticated;

DROP POLICY IF EXISTS submissions_visitor_public_read ON public.submissions;
CREATE POLICY submissions_visitor_public_read
ON public.submissions
FOR SELECT
TO anon, authenticated
USING (
  deleted_at IS NULL
  AND status IN ('aprovado', 'publicado', 'divulgado')
  AND public.event_day_sp(date) >= (now() AT TIME ZONE 'America/Sao_Paulo')::date
);