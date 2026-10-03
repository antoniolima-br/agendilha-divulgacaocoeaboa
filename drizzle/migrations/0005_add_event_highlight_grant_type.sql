ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS highlight_grant_type text;

ALTER TABLE public.submissions
  ADD CONSTRAINT submissions_highlight_grant_type_valid
  CHECK (highlight_grant_type IS NULL OR highlight_grant_type IN ('courtesy', 'paid'));

COMMENT ON COLUMN public.submissions.highlight_grant_type IS 'Administrative activation basis: promotional courtesy or financially paid highlight.';

UPDATE public.submissions
SET highlight_grant_type = 'paid'
WHERE is_highlight = true AND highlight_grant_type IS NULL;