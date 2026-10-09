CREATE TABLE public.ad_products (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 slug text NOT NULL UNIQUE,
 name text NOT NULL,
 description text NOT NULL DEFAULT '',
 placement text NOT NULL CHECK (placement IN ('carousel','agenda_card')),
 is_active boolean NOT NULL DEFAULT true,
 display_order integer NOT NULL DEFAULT 0,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ad_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ad_products TO authenticated;
GRANT ALL ON public.ad_products TO service_role;
ALTER TABLE public.ad_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY ad_products_public_read ON public.ad_products FOR SELECT TO anon, authenticated USING (is_active OR public.has_permission(auth.uid(), 'ads.manage'));
CREATE POLICY ad_products_admin_write ON public.ad_products FOR ALL TO authenticated USING (public.has_permission(auth.uid(), 'ads.manage')) WITH CHECK (public.has_permission(auth.uid(), 'ads.manage'));
ALTER TABLE public.ads ADD COLUMN product_id uuid REFERENCES public.ad_products(id), ADD COLUMN destination_url text, ADD COLUMN target_regions text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.ads ADD CONSTRAINT ads_destination_http CHECK (destination_url IS NULL OR destination_url ~* '^https?://[^[:space:]]+$'), ADD CONSTRAINT ads_valid_target_regions CHECK (target_regions <@ ARRAY['Centro','Zona Sul','Grande Tijuca','Zona Norte','Ilha do Governador','Jacarepaguá','Barra e Recreio','Zona Oeste']::text[]), ADD CONSTRAINT ads_campaign_region_required CHECK (product_id IS NULL OR cardinality(target_regions)>0);
CREATE INDEX ads_product_region_idx ON public.ads USING gin (target_regions);
CREATE FUNCTION public.guard_ad_campaign_configuration() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT public.has_permission(auth.uid(),'ads.manage') THEN
  IF TG_OP='INSERT' AND NEW.product_id IS NOT NULL THEN RAISE EXCEPTION 'Somente a equipe pode configurar campanhas publicitárias.'; END IF;
  IF TG_OP='UPDATE' AND (OLD.product_id IS NOT NULL OR NEW.product_id IS NOT NULL) AND (NEW.product_id IS DISTINCT FROM OLD.product_id OR NEW.target_regions IS DISTINCT FROM OLD.target_regions OR NEW.destination_url IS DISTINCT FROM OLD.destination_url) THEN RAISE EXCEPTION 'Somente a equipe pode configurar campanhas publicitárias.'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_ad_campaign_configuration BEFORE INSERT OR UPDATE ON public.ads FOR EACH ROW EXECUTE FUNCTION public.guard_ad_campaign_configuration();