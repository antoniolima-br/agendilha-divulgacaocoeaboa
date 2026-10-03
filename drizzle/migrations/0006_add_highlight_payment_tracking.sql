CREATE TABLE public.highlight_payment_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL UNIQUE REFERENCES public.submissions(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT highlight_payment_status_value CHECK (status IN ('pending', 'confirmed', 'cancelled'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.highlight_payment_status TO authenticated;
GRANT ALL ON public.highlight_payment_status TO service_role;

ALTER TABLE public.highlight_payment_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin teams can view highlight payment status"
ON public.highlight_payment_status
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'master'::public.app_role)
  OR public.has_role(auth.uid(), 'senior'::public.app_role)
  OR public.has_role(auth.uid(), 'financeiro'::public.app_role)
);

CREATE POLICY "Finance teams can insert highlight payment status"
ON public.highlight_payment_status
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'master'::public.app_role)
  OR public.has_role(auth.uid(), 'financeiro'::public.app_role)
);

CREATE POLICY "Finance teams can update highlight payment status"
ON public.highlight_payment_status
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'master'::public.app_role)
  OR public.has_role(auth.uid(), 'financeiro'::public.app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'master'::public.app_role)
  OR public.has_role(auth.uid(), 'financeiro'::public.app_role)
);

CREATE POLICY "Finance teams can delete highlight payment status"
ON public.highlight_payment_status
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'master'::public.app_role)
  OR public.has_role(auth.uid(), 'financeiro'::public.app_role)
);

CREATE OR REPLACE FUNCTION public.validate_highlight_payment_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'confirmed' AND NOT EXISTS (
    SELECT 1
    FROM public.payment_records pr
    WHERE pr.item_type = 'evento' AND pr.item_id = NEW.event_id
  ) THEN
    RAISE EXCEPTION 'Registre a baixa em payment_records antes de confirmar o pagamento do destaque.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_highlight_payment_confirmation_trigger
BEFORE INSERT OR UPDATE OF status ON public.highlight_payment_status
FOR EACH ROW
EXECUTE FUNCTION public.validate_highlight_payment_confirmation();

CREATE TRIGGER set_highlight_payment_status_updated_at
BEFORE UPDATE ON public.highlight_payment_status
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX highlight_payment_status_status_idx ON public.highlight_payment_status(status);
COMMENT ON TABLE public.highlight_payment_status IS 'Workflow status for event highlight payments; confirmed status requires a payment_records settlement.';