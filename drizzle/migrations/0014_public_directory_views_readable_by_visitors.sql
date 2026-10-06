ALTER VIEW public.estabelecimentos_public SET (security_invoker = false);
ALTER VIEW public.atrativos_public SET (security_invoker = false);
GRANT SELECT ON public.estabelecimentos_public, public.atrativos_public TO anon, authenticated;