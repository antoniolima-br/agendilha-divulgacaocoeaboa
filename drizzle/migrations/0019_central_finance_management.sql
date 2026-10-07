CREATE OR REPLACE FUNCTION public.can_read_finance(p_user uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT p_user IS NOT NULL AND EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=p_user AND role::text IN ('admin','senior','financeiro','master')) $$;
CREATE OR REPLACE FUNCTION public.can_write_finance(p_user uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT p_user IS NOT NULL AND EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=p_user AND role::text IN ('senior','financeiro','master')) $$;
REVOKE ALL ON FUNCTION public.can_read_finance(uuid), public.can_write_finance(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_read_finance(uuid), public.can_write_finance(uuid) TO authenticated, service_role;
ALTER POLICY "Financeiro registra baixa" ON public.payment_records WITH CHECK (public.can_write_finance(auth.uid()) AND settled_by=auth.uid());
ALTER POLICY "Financeiro edita baixa" ON public.payment_records USING (public.can_write_finance(auth.uid())) WITH CHECK (public.can_write_finance(auth.uid()));
ALTER POLICY "Financeiro remove baixa" ON public.payment_records USING (public.can_write_finance(auth.uid()));
ALTER POLICY "Financeiro envia comprovante" ON storage.objects WITH CHECK (bucket_id='payment-receipts' AND public.can_write_finance(auth.uid()));
ALTER POLICY "Finance teams can insert highlight payment status" ON public.highlight_payment_status WITH CHECK (public.can_write_finance(auth.uid()));
ALTER POLICY "Finance teams can update highlight payment status" ON public.highlight_payment_status USING (public.can_write_finance(auth.uid())) WITH CHECK (public.can_write_finance(auth.uid()));
ALTER POLICY "Finance teams can delete highlight payment status" ON public.highlight_payment_status USING (public.can_write_finance(auth.uid()));
CREATE TABLE public.finance_workflow (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), item_type text NOT NULL CHECK(item_type IN ('evento','anuncio')), item_id uuid NOT NULL, status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','released','cancelled')), expected_amount_cents integer CHECK(expected_amount_cents>=0), notes text, released_at timestamptz, released_by uuid, updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(item_type,item_id));
GRANT SELECT ON public.finance_workflow TO authenticated;
GRANT ALL ON public.finance_workflow TO service_role;
ALTER TABLE public.finance_workflow ENABLE ROW LEVEL SECURITY;
CREATE POLICY finance_workflow_read ON public.finance_workflow FOR SELECT TO authenticated USING(public.can_read_finance(auth.uid()));
CREATE TABLE public.finance_history (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), item_type text NOT NULL CHECK(item_type IN ('evento','anuncio')), item_id uuid NOT NULL, item_title text NOT NULL, action text NOT NULL, actor_id uuid NOT NULL, amount_cents integer, notes text, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.finance_history TO authenticated;
GRANT ALL ON public.finance_history TO service_role;
ALTER TABLE public.finance_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY finance_history_read ON public.finance_history FOR SELECT TO authenticated USING(public.can_read_finance(auth.uid()));
CREATE INDEX finance_history_date_idx ON public.finance_history(created_at DESC);
CREATE INDEX payment_records_item_lookup ON public.payment_records(item_type,item_id);
CREATE OR REPLACE FUNCTION public.finance_overview() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE result jsonb;
BEGIN
 IF NOT public.can_read_finance(auth.uid()) THEN RAISE EXCEPTION 'Acesso restrito à equipe administrativa' USING ERRCODE='42501'; END IF;
 WITH items AS (
 SELECT 'evento'::text item_type,s.id item_id,coalesce(nullif(s.event_title,''),s.atrativo_name,'Rolê') title,s.date,s.start_time,s.location,s.status publication_status,s.created_at FROM public.submissions s WHERE s.deleted_at IS NULL AND s.highlight_grant_type IS DISTINCT FROM 'courtesy' AND (s.promotion_choice='highlight' OR s.highlight_grant_type='paid' OR EXISTS(SELECT 1 FROM public.payment_records pr WHERE pr.item_type='evento' AND pr.item_id=s.id))
 UNION ALL SELECT 'anuncio',a.id,a.title,NULL,NULL,coalesce(a.event_location,a.neighborhood),a.status,a.created_at FROM public.ads a WHERE a.ad_type='pago' OR a.highlight_plan_id IS NOT NULL OR EXISTS(SELECT 1 FROM public.payment_records pr WHERE pr.item_type='anuncio' AND pr.item_id=a.id)
 ), rows AS (SELECT i.*,coalesce(w.status,CASE WHEN p.id IS NOT NULL THEN 'paid' ELSE 'pending' END) status,w.expected_amount_cents,w.notes,w.released_at,p.amount_cents,p.receipt_path,p.settled_at FROM items i LEFT JOIN public.finance_workflow w USING(item_type,item_id) LEFT JOIN LATERAL (SELECT pr.id,pr.amount_cents,pr.receipt_path,pr.settled_at FROM public.payment_records pr WHERE pr.item_type=i.item_type AND pr.item_id=i.item_id ORDER BY pr.settled_at DESC LIMIT 1)p ON true)
 SELECT jsonb_build_object('items',coalesce((SELECT jsonb_agg(to_jsonb(r) ORDER BY r.created_at DESC) FROM rows r),'[]'::jsonb),'payments',coalesce((SELECT jsonb_agg(jsonb_build_object('id',pr.id,'item_type',pr.item_type,'item_id',pr.item_id,'title',coalesce(i.title,'Item arquivado'),'amount_cents',pr.amount_cents,'created_at',pr.settled_at) ORDER BY pr.settled_at DESC) FROM public.payment_records pr LEFT JOIN items i ON i.item_type=pr.item_type AND i.item_id=pr.item_id),'[]'::jsonb),'history',coalesce((SELECT jsonb_agg(to_jsonb(h) ORDER BY h.created_at DESC) FROM public.finance_history h),'[]'::jsonb)) INTO result;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.finance_overview() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.finance_overview() TO authenticated;
CREATE OR REPLACE FUNCTION public.finance_manage(p_item_type text,p_item_id uuid,p_action text,p_amount_cents integer DEFAULT NULL,p_receipt_path text DEFAULT NULL,p_notes text DEFAULT NULL,p_release boolean DEFAULT false) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_title text; v_paid boolean; v_status text; v_event public.submissions%ROWTYPE; v_ad public.ads%ROWTYPE; v_actor uuid:=auth.uid();
BEGIN
 IF NOT public.can_write_finance(v_actor) THEN RAISE EXCEPTION 'Somente Financeiro, Sênior ou Master pode alterar o financeiro' USING ERRCODE='42501'; END IF;
 IF p_item_type NOT IN ('evento','anuncio') OR p_action NOT IN ('edit','settle','release','cancel') THEN RAISE EXCEPTION 'Ação inválida'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_item_type||':'||p_item_id::text,0));
 IF p_item_type='evento' THEN
 SELECT * INTO v_event FROM public.submissions WHERE id=p_item_id AND deleted_at IS NULL FOR UPDATE;
 IF NOT FOUND OR v_event.highlight_grant_type='courtesy' OR (v_event.promotion_choice<>'highlight' AND v_event.highlight_grant_type IS DISTINCT FROM 'paid') THEN RAISE EXCEPTION 'Evento patrocinado não encontrado'; END IF;
 v_title:=coalesce(v_event.event_title,v_event.atrativo_name,'Rolê');
 ELSE
 SELECT * INTO v_ad FROM public.ads WHERE id=p_item_id FOR UPDATE;
 IF NOT FOUND OR (v_ad.ad_type<>'pago' AND v_ad.highlight_plan_id IS NULL) THEN RAISE EXCEPTION 'Espaço publicitário não encontrado'; END IF;
 v_title:=v_ad.title;
 END IF;
 INSERT INTO public.finance_workflow(item_type,item_id) VALUES(p_item_type,p_item_id) ON CONFLICT(item_type,item_id) DO NOTHING;
 SELECT status INTO v_status FROM public.finance_workflow WHERE item_type=p_item_type AND item_id=p_item_id FOR UPDATE;
 SELECT EXISTS(SELECT 1 FROM public.payment_records WHERE item_type=p_item_type AND item_id=p_item_id) INTO v_paid;
 IF p_action IN ('settle','release') AND v_status='cancelled' THEN RAISE EXCEPTION 'Cobrança cancelada'; END IF;
 IF p_action='edit' THEN
 IF p_amount_cents IS NULL OR p_amount_cents<0 THEN RAISE EXCEPTION 'Informe um valor válido'; END IF;
 UPDATE public.finance_workflow SET expected_amount_cents=p_amount_cents,notes=p_notes,updated_at=now() WHERE item_type=p_item_type AND item_id=p_item_id;
 ELSIF p_action='settle' THEN
 IF v_paid THEN RAISE EXCEPTION 'A baixa já foi registrada'; END IF;
 IF p_amount_cents IS NULL OR p_amount_cents<0 OR nullif(p_receipt_path,'') IS NULL THEN RAISE EXCEPTION 'Informe valor e comprovante'; END IF;
 IF p_receipt_path NOT LIKE p_item_type||'/'||p_item_id::text||'/%' OR NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='payment-receipts' AND name=p_receipt_path) THEN RAISE EXCEPTION 'Comprovante não encontrado'; END IF;
 INSERT INTO public.payment_records(item_type,item_id,amount_cents,receipt_path,notes,settled_by) VALUES(p_item_type,p_item_id,p_amount_cents,p_receipt_path,p_notes,v_actor);
 UPDATE public.finance_workflow SET status='paid',updated_at=now() WHERE item_type=p_item_type AND item_id=p_item_id;
 INSERT INTO public.finance_history(item_type,item_id,item_title,action,actor_id,amount_cents,notes) VALUES(p_item_type,p_item_id,v_title,'settle',v_actor,p_amount_cents,p_notes);
 v_paid:=true;
 END IF;
 IF p_action='release' OR (p_action='settle' AND p_release) THEN
 IF NOT v_paid THEN RAISE EXCEPTION 'Registre a baixa antes de liberar'; END IF;
 IF v_status='released' THEN RAISE EXCEPTION 'Item já liberado'; END IF;
 IF p_item_type='evento' THEN
 IF public.event_day_sp(v_event.date) IS NULL OR public.event_day_sp(v_event.date)<(now() AT TIME ZONE 'America/Sao_Paulo')::date OR nullif(v_event.start_time,'') IS NULL OR nullif(v_event.location,'') IS NULL THEN RAISE EXCEPTION 'Confira data, horário e local antes de liberar'; END IF;
 UPDATE public.submissions SET status='publicado',approved_by=v_actor,approved_at=coalesce(approved_at,now()),published_at=now(),is_highlight=true,highlight_hidden=false,highlight_grant_type='paid',highlight_starts_at=coalesce(highlight_starts_at,now()) WHERE id=p_item_id;
 IF NOT EXISTS(SELECT 1 FROM public.submissions WHERE id=p_item_id AND status='publicado' AND is_highlight=true AND highlight_hidden=false) THEN RAISE EXCEPTION 'Não foi possível liberar o evento'; END IF;
 ELSE
 UPDATE public.ads SET status='publicado',published_at=coalesce(published_at,now()),is_highlight=true WHERE id=p_item_id;
 IF NOT EXISTS(SELECT 1 FROM public.ads WHERE id=p_item_id AND status='publicado' AND is_highlight=true) THEN RAISE EXCEPTION 'Não foi possível liberar o anúncio'; END IF;
 END IF;
 UPDATE public.finance_workflow SET status='released',released_at=now(),released_by=v_actor,updated_at=now() WHERE item_type=p_item_type AND item_id=p_item_id;
 INSERT INTO public.finance_history(item_type,item_id,item_title,action,actor_id,notes) VALUES(p_item_type,p_item_id,v_title,'release',v_actor,p_notes);
 END IF;
 IF p_action='cancel' THEN
 IF v_status='cancelled' THEN RAISE EXCEPTION 'Item já cancelado'; END IF;
 IF p_item_type='evento' THEN UPDATE public.submissions SET is_highlight=false,highlight_hidden=true WHERE id=p_item_id;
 ELSE UPDATE public.ads SET status='pendente',is_highlight=false WHERE id=p_item_id; END IF;
 UPDATE public.finance_workflow SET status='cancelled',updated_at=now() WHERE item_type=p_item_type AND item_id=p_item_id;
 END IF;
 IF p_item_type='evento' AND p_action<>'edit' THEN INSERT INTO public.highlight_payment_status(event_id,status,updated_by) VALUES(p_item_id,CASE WHEN p_action='cancel' THEN 'cancelled' ELSE 'confirmed' END,v_actor) ON CONFLICT(event_id) DO UPDATE SET status=excluded.status,updated_by=v_actor,updated_at=now(); END IF;
 IF p_action IN ('edit','cancel') THEN INSERT INTO public.finance_history(item_type,item_id,item_title,action,actor_id,amount_cents,notes) VALUES(p_item_type,p_item_id,v_title,p_action,v_actor,p_amount_cents,p_notes); END IF;
 RETURN jsonb_build_object('item_id',p_item_id,'action',p_action,'success',true);
END $$;
REVOKE ALL ON FUNCTION public.finance_manage(text,uuid,text,integer,text,text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.finance_manage(text,uuid,text,integer,text,text,boolean) TO authenticated;
CREATE OR REPLACE FUNCTION public.guard_paid_publication() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE paid_item boolean; financial_change boolean; t text;
BEGIN
 IF coalesce(auth.role(),'')='service_role' OR auth.uid() IS NULL THEN RETURN NEW; END IF;
 IF TG_TABLE_NAME='ads' THEN
 t:='anuncio'; paid_item:=NEW.ad_type='pago' OR NEW.highlight_plan_id IS NOT NULL OR OLD.ad_type='pago';
 financial_change:=NEW.status IS DISTINCT FROM OLD.status OR NEW.is_highlight IS DISTINCT FROM OLD.is_highlight OR NEW.highlight_until IS DISTINCT FROM OLD.highlight_until;
 ELSE
 t:='evento'; paid_item:=NEW.highlight_grant_type='paid' OR OLD.highlight_grant_type='paid';
 financial_change:=NEW.is_highlight IS DISTINCT FROM OLD.is_highlight OR NEW.highlight_hidden IS DISTINCT FROM OLD.highlight_hidden OR NEW.highlight_grant_type IS DISTINCT FROM OLD.highlight_grant_type OR NEW.highlight_until IS DISTINCT FROM OLD.highlight_until;
 END IF;
 IF paid_item AND financial_change THEN
 IF NOT public.can_write_finance(auth.uid()) THEN RAISE EXCEPTION 'Liberação paga restrita a Financeiro, Sênior ou Master' USING ERRCODE='42501'; END IF;
 IF NEW.is_highlight=true AND NOT EXISTS(SELECT 1 FROM public.payment_records WHERE item_type=t AND item_id=NEW.id) THEN RAISE EXCEPTION 'Registre a baixa antes de liberar o item patrocinado'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER zz_guard_paid_publication BEFORE UPDATE ON public.submissions FOR EACH ROW EXECUTE FUNCTION public.guard_paid_publication();
CREATE TRIGGER zz_guard_paid_ad_publication BEFORE UPDATE ON public.ads FOR EACH ROW EXECUTE FUNCTION public.guard_paid_publication();
CREATE OR REPLACE FUNCTION public.guard_submission_privileged_fields() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_can_approve boolean; v_is_admin boolean;
BEGIN
 v_is_admin:=public.is_admin_or_master(auth.uid()) OR (public.can_write_finance(auth.uid()) AND (NEW.highlight_grant_type='paid' OR OLD.highlight_grant_type='paid'));
 SELECT EXISTS(SELECT 1 FROM public.collaborators c WHERE c.user_id=auth.uid() AND c.is_active AND c.can_approve) INTO v_can_approve;
 IF NOT v_is_admin THEN
 NEW.is_highlight:=OLD.is_highlight; NEW.highlight_package_id:=OLD.highlight_package_id; NEW.highlight_starts_at:=OLD.highlight_starts_at; NEW.highlight_until:=OLD.highlight_until; NEW.highlight_hidden:=OLD.highlight_hidden; NEW.highlight_grant_type:=OLD.highlight_grant_type; NEW.approved_by:=OLD.approved_by; NEW.approved_at:=OLD.approved_at; NEW.published_at:=OLD.published_at; NEW.rejected_by:=OLD.rejected_by; NEW.rejected_at:=OLD.rejected_at; NEW.editorial_status:=OLD.editorial_status;
 IF NOT v_can_approve THEN NEW.status:=OLD.status; NEW.moderation_status:=OLD.moderation_status; NEW.rejection_reason:=OLD.rejection_reason; NEW.admin_notes:=OLD.admin_notes; NEW.flyer_aprovado:=OLD.flyer_aprovado; NEW.flyer_approved_at:=OLD.flyer_approved_at; END IF;
 END IF; RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.ads_guard_moderation_fields() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF public.is_admin_or_master(auth.uid()) OR (public.can_write_finance(auth.uid()) AND (NEW.ad_type='pago' OR NEW.highlight_plan_id IS NOT NULL)) THEN RETURN NEW; END IF;
 NEW.status:=OLD.status; NEW.rejection_reason:=OLD.rejection_reason; NEW.is_highlight:=OLD.is_highlight; NEW.highlight_plan_id:=OLD.highlight_plan_id; NEW.highlight_until:=OLD.highlight_until; NEW.views_count:=OLD.views_count; NEW.published_at:=OLD.published_at; RETURN NEW;
END $$;