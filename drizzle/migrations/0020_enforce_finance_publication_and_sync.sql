CREATE OR REPLACE FUNCTION public.guard_paid_publication() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE paid_item boolean; financial_change boolean; t text;
BEGIN
 IF coalesce(auth.role(),'')='service_role' OR auth.uid() IS NULL THEN RETURN NEW; END IF;
 IF TG_TABLE_NAME='ads' THEN
 t:='anuncio'; paid_item:=NEW.ad_type='pago' OR NEW.highlight_plan_id IS NOT NULL;
 financial_change:=NEW.status='publicado' OR NEW.is_highlight=true;
 IF TG_OP='UPDATE' THEN
 paid_item:=paid_item OR OLD.ad_type='pago' OR OLD.highlight_plan_id IS NOT NULL;
 financial_change:=NEW.status IS DISTINCT FROM OLD.status OR NEW.is_highlight IS DISTINCT FROM OLD.is_highlight OR NEW.highlight_until IS DISTINCT FROM OLD.highlight_until OR NEW.highlight_plan_id IS DISTINCT FROM OLD.highlight_plan_id;
 END IF;
 ELSE
 t:='evento'; paid_item:=NEW.highlight_grant_type='paid' OR (NEW.promotion_choice='highlight' AND NEW.highlight_grant_type IS DISTINCT FROM 'courtesy');
 financial_change:=NEW.status IN ('aprovado','publicado','divulgado') OR (NEW.is_highlight=true AND NEW.highlight_grant_type='paid');
 IF TG_OP='UPDATE' THEN
 paid_item:=paid_item OR OLD.highlight_grant_type='paid';
 financial_change:=(NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('aprovado','publicado','divulgado')) OR NEW.is_highlight IS DISTINCT FROM OLD.is_highlight OR NEW.highlight_hidden IS DISTINCT FROM OLD.highlight_hidden OR NEW.highlight_grant_type IS DISTINCT FROM OLD.highlight_grant_type OR NEW.highlight_until IS DISTINCT FROM OLD.highlight_until;
 END IF;
 END IF;
 IF paid_item AND financial_change THEN
 IF NOT public.can_write_finance(auth.uid()) THEN RAISE EXCEPTION 'Liberação paga restrita a Financeiro, Sênior ou Master' USING ERRCODE='42501'; END IF;
 IF (NEW.is_highlight=true OR NEW.status IN ('aprovado','publicado','divulgado')) AND NOT EXISTS(SELECT 1 FROM public.payment_records WHERE item_type=t AND item_id=NEW.id) THEN RAISE EXCEPTION 'Registre a baixa antes de liberar o item patrocinado'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER zz_guard_paid_ad_insert BEFORE INSERT ON public.ads FOR EACH ROW EXECUTE FUNCTION public.guard_paid_publication();
CREATE TRIGGER zz_guard_paid_event_insert BEFORE INSERT ON public.submissions FOR EACH ROW EXECUTE FUNCTION public.guard_paid_publication();
CREATE OR REPLACE FUNCTION public.sync_finance_payment_workflow() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 INSERT INTO public.finance_workflow(item_type,item_id,status) VALUES(NEW.item_type,NEW.item_id,'paid') ON CONFLICT(item_type,item_id) DO UPDATE SET status=CASE WHEN finance_workflow.status='pending' THEN 'paid' ELSE finance_workflow.status END,updated_at=now();
 RETURN NEW;
END $$;
CREATE TRIGGER sync_finance_payment AFTER INSERT ON public.payment_records FOR EACH ROW EXECUTE FUNCTION public.sync_finance_payment_workflow();
CREATE OR REPLACE FUNCTION public.sync_highlight_finance_workflow() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.status='cancelled' THEN
 INSERT INTO public.finance_workflow(item_type,item_id,status) VALUES('evento',NEW.event_id,'cancelled') ON CONFLICT(item_type,item_id) DO UPDATE SET status='cancelled',updated_at=now();
 ELSIF NEW.status='confirmed' THEN
 INSERT INTO public.finance_workflow(item_type,item_id,status) VALUES('evento',NEW.event_id,'paid') ON CONFLICT(item_type,item_id) DO UPDATE SET status=CASE WHEN finance_workflow.status='pending' THEN 'paid' ELSE finance_workflow.status END,updated_at=now();
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER sync_highlight_finance AFTER INSERT OR UPDATE ON public.highlight_payment_status FOR EACH ROW EXECUTE FUNCTION public.sync_highlight_finance_workflow();
ALTER POLICY "Finance teams can insert highlight payment status" ON public.highlight_payment_status WITH CHECK(public.can_write_finance(auth.uid()) AND updated_by=auth.uid());
ALTER POLICY "Finance teams can update highlight payment status" ON public.highlight_payment_status WITH CHECK(public.can_write_finance(auth.uid()) AND updated_by=auth.uid());
CREATE POLICY finance_cleanup_receipt ON storage.objects FOR DELETE TO authenticated USING(bucket_id='payment-receipts' AND public.can_write_finance(auth.uid()) AND owner_id=auth.uid()::text);
REVOKE ALL ON FUNCTION public.guard_paid_publication(),public.sync_finance_payment_workflow(),public.sync_highlight_finance_workflow() FROM PUBLIC,anon,authenticated;
