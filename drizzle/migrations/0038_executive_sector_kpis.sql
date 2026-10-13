CREATE TABLE public.intranet_kpi_targets (
 month date NOT NULL CHECK (extract(day FROM month)=1),
 metric text NOT NULL CHECK (metric IN ('leads','sales','registrations','campaign_opens','submissions','decisions','revenue','expenses','latency','probes')),
 target numeric NOT NULL CHECK (target>=0 AND target<=1000000000000),
 updated_by uuid NOT NULL DEFAULT auth.uid(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(month,metric)
);
GRANT SELECT ON public.intranet_kpi_targets TO authenticated;
GRANT ALL ON public.intranet_kpi_targets TO service_role;
ALTER TABLE public.intranet_kpi_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY kpi_targets_manager_read ON public.intranet_kpi_targets FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'master') OR public.has_role(auth.uid(),'senior'));
CREATE OR REPLACE FUNCTION public.intranet_save_kpi_targets(p_month date,p_targets jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE entry record;
BEGIN
 IF auth.uid() IS NULL OR NOT (public.has_role(auth.uid(),'master') OR public.has_role(auth.uid(),'senior')) THEN RAISE EXCEPTION 'Visão exclusiva da diretoria' USING ERRCODE='42501'; END IF;
 IF p_month IS NULL OR extract(day FROM p_month)<>1 OR jsonb_typeof(p_targets) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Metas inválidas'; END IF;
 FOR entry IN SELECT key,value FROM jsonb_each_text(p_targets) LOOP
  IF entry.value IS NULL THEN
   DELETE FROM public.intranet_kpi_targets WHERE month=p_month AND metric=entry.key;
  ELSE
   INSERT INTO public.intranet_kpi_targets(month,metric,target,updated_by) VALUES(p_month,entry.key,entry.value::numeric,auth.uid()) ON CONFLICT(month,metric) DO UPDATE SET target=excluded.target,updated_by=auth.uid(),updated_at=now();
  END IF;
 END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.intranet_save_kpi_targets(date,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.intranet_save_kpi_targets(date,jsonb) TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.intranet_sector_kpis(p_month date) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE today date:=(now() AT TIME ZONE 'America/Sao_Paulo')::date; period_end date; previous_start date; previous_end date; start_at timestamptz; end_at timestamptz; prev_start_at timestamptz; prev_end_at timestamptz; result jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT (public.has_role(auth.uid(),'master') OR public.has_role(auth.uid(),'senior')) THEN RAISE EXCEPTION 'Visão exclusiva da diretoria' USING ERRCODE='42501'; END IF;
 IF p_month IS NULL OR extract(day FROM p_month)<>1 OR p_month>today THEN RAISE EXCEPTION 'Mês inválido'; END IF;
 period_end:=least(today,(p_month+interval '1 month')::date-1);
 previous_start:=(p_month-interval '1 month')::date;
 previous_end:=least(p_month-1,previous_start+(period_end-p_month));
 start_at:=p_month::timestamp AT TIME ZONE 'America/Sao_Paulo';
 end_at:=(period_end+1)::timestamp AT TIME ZONE 'America/Sao_Paulo';
 prev_start_at:=previous_start::timestamp AT TIME ZONE 'America/Sao_Paulo';
 prev_end_at:=(previous_end+1)::timestamp AT TIME ZONE 'America/Sao_Paulo';
 WITH periods AS (SELECT false prior,start_at a,end_at b,p_month d,period_end e UNION ALL SELECT true,prev_start_at,prev_end_at,previous_start,previous_end),
 values_by_period AS (
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
REVOKE ALL ON FUNCTION public.intranet_sector_kpis(date) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.intranet_sector_kpis(date) TO authenticated,service_role;
COMMENT ON TABLE public.intranet_kpi_targets IS 'Manager-defined monthly targets. Monetary metrics in cents; expenses and manual average latency are upper limits. Never seeded as business facts.';
COMMENT ON FUNCTION public.intranet_sector_kpis(date) IS 'Manager-only actual monthly results versus equivalent elapsed days of prior month in Sao Paulo; manual latency is NULL without samples. Settled sales/payments only, not CRM proposals.';