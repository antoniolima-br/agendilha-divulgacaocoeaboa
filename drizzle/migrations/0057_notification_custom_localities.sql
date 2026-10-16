ALTER TABLE public.newsletter_subscribers ADD COLUMN IF NOT EXISTS preferred_localities text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.usuarios_publicos ADD COLUMN IF NOT EXISTS preferred_localities text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.newsletter_subscribers ADD CONSTRAINT newsletter_localities_limit CHECK (cardinality(preferred_localities) <= 10 AND char_length(array_to_string(preferred_localities, '')) <= 600);
ALTER TABLE public.usuarios_publicos ADD CONSTRAINT publico_localities_limit CHECK (cardinality(preferred_localities) <= 10 AND char_length(array_to_string(preferred_localities, '')) <= 600);
COMMENT ON COLUMN public.newsletter_subscribers.preferred_localities IS 'Known or user-typed micro-localities (sub-neighborhoods) for targeted notifications.';
COMMENT ON COLUMN public.usuarios_publicos.preferred_localities IS 'Known or user-typed micro-localities (sub-neighborhoods) for targeted notifications.';