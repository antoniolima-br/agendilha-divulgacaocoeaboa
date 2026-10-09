ALTER TABLE public.newsletter_subscribers
 ADD COLUMN IF NOT EXISTS preferred_region text,
 ADD COLUMN IF NOT EXISTS preferred_neighborhood text,
 ADD COLUMN IF NOT EXISTS all_regions boolean NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS interests text[] NOT NULL DEFAULT '{}',
 ADD COLUMN IF NOT EXISTS whatsapp_consent boolean NOT NULL DEFAULT false;
ALTER TABLE public.usuarios_publicos
 ADD COLUMN IF NOT EXISTS preferred_region text,
 ADD COLUMN IF NOT EXISTS preferred_neighborhood text,
 ADD COLUMN IF NOT EXISTS all_regions boolean NOT NULL DEFAULT false;
ALTER TABLE public.newsletter_subscribers ADD CONSTRAINT newsletter_preferred_region_valid CHECK (preferred_region IS NULL OR preferred_region = ANY (ARRAY['Centro','Zona Sul','Grande Tijuca','Zona Norte','Ilha do Governador','Jacarepaguá','Barra e Recreio','Zona Oeste']));
ALTER TABLE public.usuarios_publicos ADD CONSTRAINT publico_preferred_region_valid CHECK (preferred_region IS NULL OR preferred_region = ANY (ARRAY['Centro','Zona Sul','Grande Tijuca','Zona Norte','Ilha do Governador','Jacarepaguá','Barra e Recreio','Zona Oeste']));
ALTER TABLE public.newsletter_subscribers ADD CONSTRAINT newsletter_all_regions_exclusive CHECK (NOT all_regions OR (preferred_region IS NULL AND preferred_neighborhood IS NULL));
ALTER TABLE public.usuarios_publicos ADD CONSTRAINT publico_all_regions_exclusive CHECK (NOT all_regions OR (preferred_region IS NULL AND preferred_neighborhood IS NULL));
COMMENT ON COLUMN public.newsletter_subscribers.preferred_region IS 'Notification audience preference; does not grant push consent.';
COMMENT ON COLUMN public.usuarios_publicos.preferred_region IS 'Preferred notification macro-region, separate from contact home neighborhood.';