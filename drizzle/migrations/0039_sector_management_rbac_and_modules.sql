CREATE OR REPLACE FUNCTION public.intranet_can_view()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path=public
AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id=auth.uid()
      AND role::text IN ('master','senior','admin','comercial','marketing','administracao','financeiro','desenvolvimento')
  )
$$;
REVOKE ALL ON FUNCTION public.intranet_can_view() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.intranet_can_view() TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.intranet_can_edit_sector(p_sector text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path=public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND p_sector IN ('comercial','marketing','administracao','financeiro','desenvolvimento')
    AND (
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role::text IN ('master','senior'))
      OR (p_sector='comercial' AND auth.uid()='e994c1c8-90c0-43cc-91f3-21357039919f'::uuid AND public.has_role(auth.uid(),'senior'))
      OR (p_sector='marketing' AND auth.uid()='5437c27d-4b91-46d8-905d-d23477fb7db5'::uuid AND public.has_role(auth.uid(),'marketing'))
      OR (p_sector='administracao' AND auth.uid()='8231a915-6840-42bd-8ea1-43772330cbdf'::uuid AND public.has_role(auth.uid(),'admin'))
      OR (p_sector='financeiro' AND public.has_role(auth.uid(),'financeiro'))
      OR (p_sector='desenvolvimento' AND public.has_role(auth.uid(),'desenvolvimento'))
    )
$$;
REVOKE ALL ON FUNCTION public.intranet_can_edit_sector(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.intranet_can_edit_sector(text) TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.intranet_can_access(p_sector text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path=public
AS $$
  SELECT p_sector IN ('comercial','marketing','administracao','financeiro','desenvolvimento')
    AND public.intranet_can_view()
$$;

CREATE OR REPLACE FUNCTION public.can_read_finance(p_user uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path=public
AS $$
  SELECT p_user IS NOT NULL AND p_user=auth.uid() AND public.intranet_can_view()
$$;

DROP POLICY IF EXISTS leads_sector ON public.intranet_leads;
CREATE POLICY leads_read ON public.intranet_leads FOR SELECT TO authenticated USING (public.intranet_can_view());
CREATE POLICY leads_insert ON public.intranet_leads FOR INSERT TO authenticated WITH CHECK (public.intranet_can_edit_sector('comercial') AND created_by=auth.uid());
CREATE POLICY leads_update ON public.intranet_leads FOR UPDATE TO authenticated USING (public.intranet_can_edit_sector('comercial')) WITH CHECK (public.intranet_can_edit_sector('comercial'));
CREATE POLICY leads_delete ON public.intranet_leads FOR DELETE TO authenticated USING (public.intranet_can_edit_sector('comercial'));

ALTER TABLE public.intranet_campaigns ADD COLUMN IF NOT EXISTS platform text NOT NULL DEFAULT 'organico' CHECK (platform IN ('organico','meta','tiktok','youtube','google'));
ALTER TABLE public.intranet_campaigns ADD COLUMN IF NOT EXISTS forecast_cents integer NOT NULL DEFAULT 0 CHECK (forecast_cents>=0);
ALTER TABLE public.intranet_campaigns ADD COLUMN IF NOT EXISTS expected_return_cents integer NOT NULL DEFAULT 0 CHECK (expected_return_cents>=0);
DROP POLICY IF EXISTS campaigns_sector ON public.intranet_campaigns;
CREATE POLICY campaigns_read ON public.intranet_campaigns FOR SELECT TO authenticated USING (public.intranet_can_view());
CREATE POLICY campaigns_insert ON public.intranet_campaigns FOR INSERT TO authenticated WITH CHECK (public.intranet_can_edit_sector('marketing') AND created_by=auth.uid());
CREATE POLICY campaigns_update ON public.intranet_campaigns FOR UPDATE TO authenticated USING (public.intranet_can_edit_sector('marketing')) WITH CHECK (public.intranet_can_edit_sector('marketing'));
CREATE POLICY campaigns_delete ON public.intranet_campaigns FOR DELETE TO authenticated USING (public.intranet_can_edit_sector('marketing'));

DROP POLICY IF EXISTS operations_read ON public.intranet_operations;
DROP POLICY IF EXISTS operations_insert ON public.intranet_operations;
DROP POLICY IF EXISTS operations_update ON public.intranet_operations;
DROP POLICY IF EXISTS operations_delete ON public.intranet_operations;
CREATE POLICY operations_read ON public.intranet_operations FOR SELECT TO authenticated USING (public.intranet_can_view());
CREATE POLICY operations_insert ON public.intranet_operations FOR INSERT TO authenticated WITH CHECK (public.intranet_can_edit_sector(sector) AND created_by=auth.uid());
CREATE POLICY operations_update ON public.intranet_operations FOR UPDATE TO authenticated USING (public.intranet_can_edit_sector(sector)) WITH CHECK (public.intranet_can_edit_sector(sector));
CREATE POLICY operations_delete ON public.intranet_operations FOR DELETE TO authenticated USING (public.intranet_can_edit_sector(sector));

DROP POLICY IF EXISTS health_read ON public.intranet_health_samples;
DROP POLICY IF EXISTS health_write ON public.intranet_health_samples;
CREATE POLICY health_read ON public.intranet_health_samples FOR SELECT TO authenticated USING (public.intranet_can_view());
CREATE POLICY health_write ON public.intranet_health_samples FOR INSERT TO authenticated WITH CHECK (public.intranet_can_edit_sector('desenvolvimento') AND created_by=auth.uid());

DROP POLICY IF EXISTS campaign_daily_read ON public.intranet_campaign_daily;
CREATE POLICY campaign_daily_read ON public.intranet_campaign_daily FOR SELECT TO authenticated USING (public.intranet_can_view());

DROP POLICY IF EXISTS kpi_targets_manager_read ON public.intranet_kpi_targets;
CREATE POLICY kpi_targets_team_read ON public.intranet_kpi_targets FOR SELECT TO authenticated USING (public.intranet_can_view());

CREATE TABLE public.intranet_investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 160),
  category text NOT NULL DEFAULT 'Marketing' CHECK (length(category) BETWEEN 2 AND 80),
  amount_cents integer NOT NULL CHECK (amount_cents>0),
  expected_return_cents integer NOT NULL DEFAULT 0 CHECK (expected_return_cents>=0),
  actual_return_cents integer NOT NULL DEFAULT 0 CHECK (actual_return_cents>=0),
  invested_on date NOT NULL,
  status text NOT NULL DEFAULT 'planejado' CHECK (status IN ('planejado','ativo','encerrado')),
  notes text NOT NULL DEFAULT '' CHECK (length(notes)<=2000),
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.intranet_investments TO authenticated;
GRANT ALL ON public.intranet_investments TO service_role;
ALTER TABLE public.intranet_investments ENABLE ROW LEVEL SECURITY;
CREATE POLICY investments_read ON public.intranet_investments FOR SELECT TO authenticated USING (public.intranet_can_view());
CREATE POLICY investments_insert ON public.intranet_investments FOR INSERT TO authenticated WITH CHECK (public.intranet_can_edit_sector('financeiro') AND created_by=auth.uid());
CREATE POLICY investments_update ON public.intranet_investments FOR UPDATE TO authenticated USING (public.intranet_can_edit_sector('financeiro')) WITH CHECK (public.intranet_can_edit_sector('financeiro'));
CREATE POLICY investments_delete ON public.intranet_investments FOR DELETE TO authenticated USING (public.intranet_can_edit_sector('financeiro'));
CREATE INDEX intranet_investments_date_idx ON public.intranet_investments(invested_on DESC);
CREATE TRIGGER intranet_investments_updated_at BEFORE UPDATE ON public.intranet_investments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.intranet_sector_access()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path=public
AS $$
  SELECT jsonb_build_object(
    'can_view',public.intranet_can_view(),
    'editors',jsonb_build_object(
      'comercial',public.intranet_can_edit_sector('comercial'),
      'marketing',public.intranet_can_edit_sector('marketing'),
      'administracao',public.intranet_can_edit_sector('administracao'),
      'financeiro',public.intranet_can_edit_sector('financeiro'),
      'desenvolvimento',public.intranet_can_edit_sector('desenvolvimento')
    )
  )
$$;
REVOKE ALL ON FUNCTION public.intranet_sector_access() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.intranet_sector_access() TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.intranet_bi(p_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path=public
AS $$
DECLARE since timestamptz; first_day date; today date:=(now() AT TIME ZONE 'America/Sao_Paulo')::date; received bigint; spent bigint; result jsonb;
BEGIN
 IF NOT public.intranet_can_view() THEN RAISE EXCEPTION 'Acesso restrito à equipe de gestão' USING ERRCODE='42501'; END IF;
 IF p_days IS NULL OR p_days NOT IN (7,30,90) THEN RAISE EXCEPTION 'Período inválido'; END IF;
 first_day:=today-p_days+1; since:=first_day::timestamp AT TIME ZONE 'America/Sao_Paulo';
 SELECT coalesce(sum(amount_cents),0) INTO received FROM public.payment_records WHERE settled_at>=since;
 SELECT coalesce(sum(amount_cents),0) INTO spent FROM public.finance_expenses WHERE expense_date BETWEEN first_day AND today;
 result:=jsonb_build_object('summary',jsonb_build_object('received_cents',received,'expenses_cents',spent,'balance_cents',received-spent,'submissions',(SELECT count(*) FROM public.submissions WHERE deleted_at IS NULL AND created_at>=since),'users',(SELECT count(*) FROM public.profiles WHERE created_at>=since),'campaign_opens',(SELECT coalesce(sum(opens),0) FROM public.intranet_campaign_daily WHERE day BETWEEN first_day AND today),'won_leads',(SELECT count(*) FROM public.intranet_leads WHERE stage='ganho'),'open_operations',(SELECT count(*) FROM public.intranet_operations WHERE status<>'concluido')),
 'cashflow',(SELECT coalesce(jsonb_agg(to_jsonb(t)),'[]') FROM(SELECT d::date::text name,coalesce((SELECT sum(amount_cents) FROM public.payment_records WHERE (settled_at AT TIME ZONE 'America/Sao_Paulo')::date=d::date),0) revenue,coalesce((SELECT sum(amount_cents) FROM public.finance_expenses WHERE expense_date=d::date),0) expenses FROM generate_series(first_day::timestamp,today::timestamp,interval '1 day') d ORDER BY d)t),
 'sources',(SELECT coalesce(jsonb_agg(to_jsonb(t)),'[]') FROM(SELECT CASE WHEN p.item_type='evento' THEN coalesce(h.name,'Evento patrocinado') ELSE coalesce(pr.name,ap.name,'Espaço publicitário') END name,sum(p.amount_cents) value FROM public.payment_records p LEFT JOIN public.submissions s ON p.item_type='evento' AND s.id=p.item_id LEFT JOIN public.highlight_packages h ON h.id=s.highlight_package_id LEFT JOIN public.ads a ON p.item_type='anuncio' AND a.id=p.item_id LEFT JOIN public.ad_products pr ON pr.id=a.product_id LEFT JOIN public.ad_plans ap ON ap.id=a.highlight_plan_id WHERE p.settled_at>=since GROUP BY 1)t),
 'funnel',(SELECT coalesce(jsonb_agg(to_jsonb(t)),'[]') FROM(SELECT stage name,count(*) value FROM public.intranet_leads GROUP BY stage)t),
 'traffic',(SELECT coalesce(jsonb_agg(to_jsonb(t)),'[]') FROM(SELECT day::text name,sum(opens) value FROM public.intranet_campaign_daily WHERE day BETWEEN first_day AND today GROUP BY day ORDER BY day)t),
 'campaigns',(SELECT coalesce(jsonb_agg(to_jsonb(t)),'[]') FROM(SELECT CASE c.platform WHEN 'meta' THEN 'Meta' WHEN 'tiktok' THEN 'TikTok' WHEN 'youtube' THEN 'YouTube' WHEN 'google' THEN 'Google' ELSE 'Orgânico' END name,coalesce(sum(d.opens),0) value FROM public.intranet_campaigns c LEFT JOIN public.intranet_campaign_daily d ON d.campaign_id=c.id AND d.day BETWEEN first_day AND today GROUP BY c.platform)t),
 'operations',(SELECT coalesce(jsonb_agg(to_jsonb(t)),'[]') FROM(SELECT CASE sector WHEN 'administracao' THEN 'Curadoria' ELSE 'Desenvolvimento' END name,count(*) FILTER(WHERE status<>'concluido') value FROM public.intranet_operations GROUP BY sector)t),
 'administration',public.intranet_dashboard('administracao',p_days),'marketing',public.intranet_dashboard('marketing',p_days),'commercial',public.intranet_dashboard('comercial',p_days));
 RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.intranet_sector_kpis(p_month date)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path=public
AS $$
DECLARE today date:=(now() AT TIME ZONE 'America/Sao_Paulo')::date; period_end date; previous_start date; previous_end date; start_at timestamptz; end_at timestamptz; prev_start_at timestamptz; prev_end_at timestamptz; result jsonb;
BEGIN
 IF NOT public.intranet_can_view() THEN RAISE EXCEPTION 'Acesso restrito à equipe de gestão' USING ERRCODE='42501'; END IF;
 IF p_month IS NULL OR extract(day FROM p_month)<>1 OR p_month>today THEN RAISE EXCEPTION 'Mês inválido'; END IF;
 period_end:=least(today,(p_month+interval '1 month')::date-1); previous_start:=(p_month-interval '1 month')::date; previous_end:=least(p_month-1,previous_start+(period_end-p_month));
 start_at:=p_month::timestamp AT TIME ZONE 'America/Sao_Paulo'; end_at:=(period_end+1)::timestamp AT TIME ZONE 'America/Sao_Paulo'; prev_start_at:=previous_start::timestamp AT TIME ZONE 'America/Sao_Paulo'; prev_end_at:=(previous_end+1)::timestamp AT TIME ZONE 'America/Sao_Paulo';
 WITH periods AS (SELECT false prior,start_at a,end_at b,p_month d,period_end e UNION ALL SELECT true,prev_start_at,prev_end_at,previous_start,previous_end), values_by_period AS (
 SELECT p.prior,v.metric,v.value FROM periods p CROSS JOIN LATERAL (
 SELECT 'leads' metric,count(*)::numeric value FROM public.intranet_leads WHERE created_at>=p.a AND created_at<p.b
 UNION ALL SELECT 'sales',count(*)::numeric FROM public.payment_records WHERE settled_at>=p.a AND settled_at<p.b
 UNION ALL SELECT 'registrations',count(*)::numeric FROM public.profiles WHERE created_at>=p.a AND created_at<p.b
 UNION ALL SELECT 'campaign_opens',coalesce(sum(opens),0)::numeric FROM public.intranet_campaign_daily WHERE day BETWEEN p.d AND p.e
 UNION ALL SELECT 'submissions',count(*)::numeric FROM public.submissions WHERE deleted_at IS NULL AND created_at>=p.a AND created_at<p.b
 UNION ALL SELECT 'decisions',count(*)::numeric FROM public.submissions WHERE deleted_at IS NULL AND coalesce(approved_at,rejected_at)>=p.a AND coalesce(approved_at,rejected_at)<p.b
 UNION ALL SELECT 'revenue',coalesce(sum(amount_cents),0)::numeric FROM public.payment_records WHERE settled_at>=p.a AND settled_at<p.b
 UNION ALL SELECT 'expenses',coalesce(sum(amount_cents),0)::numeric FROM public.finance_expenses WHERE expense_date BETWEEN p.d AND p.e
 UNION ALL SELECT 'latency',round(avg(latency_ms)::numeric,1) FROM public.intranet_health_samples WHERE created_at>=p.a AND created_at<p.b
 UNION ALL SELECT 'probes',count(*)::numeric FROM public.intranet_health_samples WHERE created_at>=p.a AND created_at<p.b
 ) v), paired AS (SELECT metric,max(value) FILTER(WHERE NOT prior) current,max(value) FILTER(WHERE prior) previous FROM values_by_period GROUP BY metric)
 SELECT jsonb_build_object('month',p_month,'through',period_end,'previous_from',previous_start,'previous_through',previous_end,'as_of',now(),'metrics',jsonb_agg(jsonb_build_object('key',p.metric,'current',p.current,'previous',p.previous,'target',t.target) ORDER BY p.metric)) INTO result FROM paired p LEFT JOIN public.intranet_kpi_targets t ON t.metric=p.metric AND t.month=p_month;
 RETURN result;
END $$;

COMMENT ON FUNCTION public.intranet_can_edit_sector(text) IS 'Department write gate: direct responsible role/account, Senior, or Master. Reads remain available to the management team.';
COMMENT ON TABLE public.intranet_investments IS 'Financial investment ledger with expected and actual return; writes restricted to Finance, Senior, or Master.';