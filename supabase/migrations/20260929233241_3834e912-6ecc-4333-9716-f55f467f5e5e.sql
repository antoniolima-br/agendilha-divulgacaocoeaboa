ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'senior';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'financeiro';

ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS is_free boolean NOT NULL DEFAULT false;

CREATE TABLE public.payment_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type text NOT NULL CHECK (item_type IN ('anuncio','evento')),
  item_id uuid NOT NULL,
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  receipt_path text,
  notes text,
  settled_by uuid NOT NULL DEFAULT auth.uid(),
  settled_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_records TO authenticated;
GRANT ALL ON public.payment_records TO service_role;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins veem pagamentos" ON public.payment_records FOR SELECT TO authenticated
USING (public.is_admin_or_master(auth.uid()) OR public.has_role(auth.uid(), 'senior'::text) OR public.has_role(auth.uid(), 'financeiro'::text));
CREATE POLICY "Financeiro registra baixa" ON public.payment_records FOR INSERT TO authenticated
WITH CHECK ((public.has_role(auth.uid(), 'financeiro'::text) OR public.is_master(auth.uid())) AND settled_by = auth.uid());
CREATE POLICY "Financeiro edita baixa" ON public.payment_records FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'financeiro'::text) OR public.is_master(auth.uid()));
CREATE POLICY "Financeiro remove baixa" ON public.payment_records FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'financeiro'::text) OR public.is_master(auth.uid()));

CREATE TRIGGER payment_records_updated_at BEFORE UPDATE ON public.payment_records
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Financeiro envia comprovante" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'payment-receipts' AND (public.has_role(auth.uid(), 'financeiro'::text) OR public.is_master(auth.uid())));
CREATE POLICY "Admins leem comprovante" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'payment-receipts' AND (public.is_admin_or_master(auth.uid()) OR public.has_role(auth.uid(), 'senior'::text) OR public.has_role(auth.uid(), 'financeiro'::text)));