ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS interest_event_id uuid REFERENCES public.submissions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS interest_status text NOT NULL DEFAULT 'interessado' CHECK (interest_status IN ('interessado','confirmado','compareceu','cancelado'));

CREATE INDEX IF NOT EXISTS newsletter_subscribers_interest_event_idx ON public.newsletter_subscribers(interest_event_id);

GRANT UPDATE, DELETE ON public.newsletter_subscribers TO authenticated;

CREATE POLICY "Admins can update newsletter subscribers" ON public.newsletter_subscribers
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Admins can delete newsletter subscribers" ON public.newsletter_subscribers
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'master'::app_role));

CREATE TABLE public.crm_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 160),
  message text NOT NULL DEFAULT '' CHECK (length(message) <= 2000),
  event_id uuid REFERENCES public.submissions(id) ON DELETE SET NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_notifications TO authenticated;
GRANT ALL ON public.crm_notifications TO service_role;
ALTER TABLE public.crm_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage crm notifications" ON public.crm_notifications FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'master'::app_role));

CREATE TABLE public.crm_notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.crm_notifications(id) ON DELETE CASCADE,
  subscriber_id uuid NOT NULL REFERENCES public.newsletter_subscribers(id) ON DELETE CASCADE,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (notification_id, subscriber_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_notification_deliveries TO authenticated;
GRANT ALL ON public.crm_notification_deliveries TO service_role;
ALTER TABLE public.crm_notification_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage crm deliveries" ON public.crm_notification_deliveries FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'master'::app_role));