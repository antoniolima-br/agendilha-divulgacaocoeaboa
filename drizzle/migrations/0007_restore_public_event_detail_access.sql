ALTER VIEW public.public_submissions SET (security_invoker = false);
GRANT SELECT ON public.public_submissions TO anon, authenticated;
COMMENT ON VIEW public.public_submissions IS 'Public projection of approved events; security definer access prevents exposing private submissions columns while keeping public event details available.';