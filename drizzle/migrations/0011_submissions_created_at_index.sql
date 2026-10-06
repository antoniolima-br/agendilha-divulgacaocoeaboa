CREATE INDEX IF NOT EXISTS idx_submissions_created_at_all ON public.submissions USING btree (created_at DESC);
DROP INDEX IF EXISTS public.idx_submissions_slug;