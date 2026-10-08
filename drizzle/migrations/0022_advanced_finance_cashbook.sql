CREATE TABLE public.finance_expenses (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), description text NOT NULL CHECK(length(trim(description)) BETWEEN 2 AND 200), category text NOT NULL CHECK(length(trim(category)) BETWEEN 2 AND 80), amount_cents integer NOT NULL CHECK(amount_cents>0), expense_date date NOT NULL, notes text, created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.finance_expenses TO authenticated;
GRANT ALL ON public.finance_expenses TO service_role;
ALTER TABLE public.finance_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY finance_expenses_read ON public.finance_expenses FOR SELECT TO authenticated USING(public.can_read_finance(auth.uid()));
CREATE INDEX finance_expenses_date_idx ON public.finance_expenses(expense_date DESC);
CREATE TABLE public.finance_contracts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), item_type text NOT NULL CHECK(item_type IN ('evento','anuncio')), item_id uuid NOT NULL, commercial_type text NOT NULL CHECK(commercial_type IN ('paid','courtesy','barter')), reference_amount_cents integer NOT NULL DEFAULT 0 CHECK(reference_amount_cents>=0), starts_on date, ends_on date, notes text, updated_by uuid NOT NULL, updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(item_type,item_id), CHECK(ends_on IS NULL OR starts_on IS NULL OR ends_on>=starts_on));
GRANT SELECT ON public.finance_contracts TO authenticated;
GRANT ALL ON public.finance_contracts TO service_role;
ALTER TABLE public.finance_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY finance_contracts_read ON public.finance_contracts FOR SELECT TO authenticated USING(public.can_read_finance(auth.uid()));
CREATE OR REPLACE FUNCTION public.finance_add_expense(p_description text,p_category text,p_amount_cents integer,p_expense_date date,p_notes text DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_id uuid; v_actor uuid:=auth.uid();
BEGIN
IF NOT public.can_write_finance(v_actor) THEN RAISE EXCEPTION 'Seu acesso ao financeiro é somente leitura' USING ERRCODE='42501'; END IF;
IF p_expense_date IS NULL OR p_expense_date>(now() AT TIME ZONE 'America/Sao_Paulo')::date THEN RAISE EXCEPTION 'Informe a data de uma despesa já paga'; END IF;
IF length(coalesce(p_notes,''))>2000 THEN RAISE EXCEPTION 'Observações muito longas'; END IF;
INSERT INTO public.finance_expenses(description,category,amount_cents,expense_date,notes,created_by) VALUES(trim(p_description),trim(p_category),p_amount_cents,p_expense_date,p_notes,v_actor) RETURNING id INTO v_id;
RETURN jsonb_build_object('success',true,'id',v_id);
END $$;
CREATE OR REPLACE FUNCTION public.finance_save_contract(p_item_type text,p_item_id uuid,p_commercial_type text,p_reference_amount_cents integer DEFAULT 0,p_starts_on date DEFAULT NULL,p_ends_on date DEFAULT NULL,p_notes text DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_actor uuid:=auth.uid(); v_id uuid; v_title text;
BEGIN
IF NOT public.can_write_finance(v_actor) THEN RAISE EXCEPTION 'Seu acesso ao financeiro é somente leitura' USING ERRCODE='42501'; END IF;
IF p_item_type='evento' THEN SELECT coalesce(event_title,atrativo_name,'Rolê') INTO v_title FROM public.submissions WHERE id=p_item_id AND deleted_at IS NULL; ELSE SELECT title INTO v_title FROM public.ads WHERE id=p_item_id; END IF;
IF v_title IS NULL OR p_item_type NOT IN ('evento','anuncio') THEN RAISE EXCEPTION 'Item não encontrado'; END IF;
IF p_commercial_type IN ('courtesy','barter') AND EXISTS(SELECT 1 FROM public.payment_records WHERE item_type=p_item_type AND item_id=p_item_id) THEN RAISE EXCEPTION 'Este item já tem receita registrada e não pode virar cortesia ou permuta'; END IF;
IF length(coalesce(p_notes,''))>2000 THEN RAISE EXCEPTION 'Observações muito longas'; END IF;
INSERT INTO public.finance_contracts(item_type,item_id,commercial_type,reference_amount_cents,starts_on,ends_on,notes,updated_by) VALUES(p_item_type,p_item_id,p_commercial_type,p_reference_amount_cents,p_starts_on,p_ends_on,p_notes,v_actor) ON CONFLICT(item_type,item_id) DO UPDATE SET commercial_type=excluded.commercial_type,reference_amount_cents=excluded.reference_amount_cents,starts_on=excluded.starts_on,ends_on=excluded.ends_on,notes=excluded.notes,updated_by=v_actor,updated_at=now() RETURNING id INTO v_id;
INSERT INTO public.finance_history(item_type,item_id,item_title,action,actor_id,notes) VALUES(p_item_type,p_item_id,v_title,'contract',v_actor,p_commercial_type||': '||coalesce(p_notes,''));
RETURN jsonb_build_object('success',true,'id',v_id);
END $$;
DO $$ DECLARE d text; BEGIN
SELECT pg_get_functiondef('public.finance_manage(text,uuid,text,integer,text,text,boolean)'::regprocedure) INTO d;
d:=replace(d, 'IF p_action=''release'' OR (p_action=''settle'' AND p_release) THEN', 'IF p_action IN (''release'',''settle'') THEN');
d:=replace(d, 'IF p_action IN (''settle'',''release'') AND v_status=''cancelled'' THEN', 'IF p_action IN (''settle'',''release'') AND EXISTS(SELECT 1 FROM public.finance_contracts WHERE item_type=p_item_type AND item_id=p_item_id AND commercial_type IN (''courtesy'',''barter'')) THEN RAISE EXCEPTION ''Cortesias e permutas não geram baixa financeira''; END IF; IF p_action IN (''settle'',''release'') AND v_status=''cancelled'' THEN');
EXECUTE d;
END $$;
CREATE OR REPLACE FUNCTION public.finance_dashboard() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE v_result jsonb; v_inventory jsonb;
BEGIN
v_result:=public.finance_overview();
WITH inventory AS (
SELECT 'evento'::text item_type,s.id item_id,coalesce(nullif(s.event_title,''),s.atrativo_name,'Rolê') title,s.status publication_status,s.created_at,s.highlight_until,CASE WHEN s.highlight_grant_type='courtesy' THEN 'courtesy' ELSE 'paid' END default_type FROM public.submissions s WHERE s.deleted_at IS NULL AND (s.promotion_choice='highlight' OR s.highlight_grant_type IS NOT NULL OR EXISTS(SELECT 1 FROM public.finance_contracts c WHERE c.item_type='evento' AND c.item_id=s.id))
UNION ALL SELECT 'anuncio',a.id,a.title,a.status,a.created_at,a.highlight_until,'paid' FROM public.ads a WHERE a.ad_type='pago' OR a.highlight_plan_id IS NOT NULL OR a.is_highlight OR EXISTS(SELECT 1 FROM public.finance_contracts c WHERE c.item_type='anuncio' AND c.item_id=a.id)
), rows AS (SELECT i.*,coalesce(c.commercial_type,i.default_type) commercial_type,coalesce(c.reference_amount_cents,w.expected_amount_cents,0) reference_amount_cents,c.starts_on,c.ends_on,c.notes,coalesce(w.status,'pending') workflow_status FROM inventory i LEFT JOIN public.finance_contracts c USING(item_type,item_id) LEFT JOIN public.finance_workflow w USING(item_type,item_id))
SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.created_at DESC),'[]'::jsonb) INTO v_inventory FROM rows r;
RETURN v_result||jsonb_build_object('expenses',coalesce((SELECT jsonb_agg(to_jsonb(e) ORDER BY expense_date DESC,created_at DESC) FROM public.finance_expenses e),'[]'::jsonb),'inventory',v_inventory);
END $$;
REVOKE ALL ON FUNCTION public.finance_add_expense(text,text,integer,date,text),public.finance_save_contract(text,uuid,text,integer,date,date,text),public.finance_dashboard() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.finance_add_expense(text,text,integer,date,text),public.finance_save_contract(text,uuid,text,integer,date,date,text),public.finance_dashboard() TO authenticated,service_role;