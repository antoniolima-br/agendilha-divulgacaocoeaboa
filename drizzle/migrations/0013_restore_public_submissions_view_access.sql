ALTER VIEW public.public_submissions SET (security_invoker = false);
GRANT SELECT ON public.public_submissions TO anon, authenticated;