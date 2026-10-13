CREATE TABLE public.intranet_operations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 sector text NOT NULL CHECK (sector IN ('administracao','desenvolvimento')),
 title text NOT NULL CHECK (length(trim(title)) BETWEEN 2 AND 160),
 status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','em_andamento','concluido')),
 priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal','alta','urgente')),
 responsible text NOT NULL DEFAULT '' CHECK (length(responsible)<=160),
 due_on date,
 notes text NOT NULL DEFAULT '' CHECK (length(notes)<=2000),
 created_by uuid NOT NULL DEFAULT auth.uid(),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.intranet_operations TO authenticated;
GRANT ALL ON public.intranet_operations TO service_role;
ALTER TABLE public.intranet_operations ENABLE ROW LEVEL SECURITY;
CREATE POLICY operations_read ON public.intranet_operations FOR SELECT TO authenticated USING (public.intranet_can_access(sector));
CREATE POLICY operations_insert ON public.intranet_operations FOR INSERT TO authenticated WITH CHECK (public.intranet_can_access(sector) AND created_by=auth.uid());
CREATE POLICY operations_update ON public.intranet_operations FOR UPDATE TO authenticated USING (public.intranet_can_access(sector)) WITH CHECK (public.intranet_can_access(sector));
CREATE POLICY operations_delete ON public.intranet_operations FOR DELETE TO authenticated USING (public.intranet_can_access(sector));
CREATE INDEX intranet_operations_sector_idx ON public.intranet_operations(sector,created_at DESC);
CREATE TRIGGER operations_updated_at BEFORE UPDATE ON public.intranet_operations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TABLE public.intranet_campaign_daily (
 campaign_id uuid NOT NULL REFERENCES public.intranet_campaigns(id) ON DELETE CASCADE,
 day date NOT NULL,
 opens bigint NOT NULL DEFAULT 0,
 PRIMARY KEY(campaign_id,day)
);
GRANT SELECT ON public.intranet_campaign_daily TO authenticated;
GRANT ALL ON public.intranet_campaign_daily TO service_role;
ALTER TABLE public.intranet_campaign_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY campaign_daily_read ON public.intranet_campaign_daily FOR SELECT TO authenticated USING(public.intranet_can_access('marketing'));
CREATE OR REPLACE FUNCTION public.intranet_open_campaign(p_id uuid) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE destination_url text;
BEGIN
 PERFORM set_config('app.intranet_click','yes',true);
 UPDATE public.intranet_campaigns SET clicks=clicks+1 WHERE id=p_id AND status='ativa' RETURNING destination INTO destination_url;
 IF destination_url IS NOT NULL THEN
  INSERT INTO public.intranet_campaign_daily(campaign_id,day,opens) VALUES(p_id,(now() AT TIME ZONE 'America/Sao_Paulo')::date,1)
  ON CONFLICT(campaign_id,day) DO UPDATE SET opens=intranet_campaign_daily.opens+1;
 END IF;
 RETURN destination_url;
END $$;
CREATE OR REPLACE FUNCTION public.intranet_dashboard(p_sector text,p_days integer DEFAULT 30) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE result jsonb; since timestamptz:=date_trunc('day',now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo' - make_interval(days=>p_days-1); manager boolean;
BEGIN
 IF NOT public.intranet_can_access(p_sector) THEN RAISE EXCEPTION 'Sem acesso a este setor' USING ERRCODE='42501'; END IF;
 IF p_days NOT IN (7,30,90) OR p_days IS NULL THEN RAISE EXCEPTION 'Período inválido'; END IF;
 manager:=EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role::text IN ('master','senior'));
 result:=jsonb_build_object('summary',jsonb_build_object('submissions',CASE WHEN manager OR p_sector='administracao' THEN (SELECT count(*) FROM public.submissions WHERE deleted_at IS NULL AND created_at>=since) ELSE 0 END,'pending',CASE WHEN manager OR p_sector='administracao' THEN (SELECT count(*) FROM public.submissions WHERE deleted_at IS NULL AND status='pendente') ELSE 0 END,'users',CASE WHEN manager OR p_sector='marketing' THEN (SELECT count(*) FROM public.profiles WHERE created_at>=since) ELSE 0 END,'received_cents',CASE WHEN manager OR p_sector='financeiro' THEN (SELECT coalesce(sum(amount_cents),0) FROM public.payment_records WHERE settled_at>=since) ELSE 0 END),'consolidated','[]'::jsonb);
 IF manager OR p_sector='administracao' THEN
  result:=result||jsonb_build_object('consolidated',(SELECT coalesce(jsonb_agg(to_jsonb(t)),'[]') FROM (SELECT (created_at AT TIME ZONE 'America/Sao_Paulo')::date::text name,count(*) value FROM public.submissions WHERE deleted_at IS NULL AND created_at>=since GROUP BY 1 ORDER BY 1) t));
 END IF;
 IF p_sector='administracao' THEN result:=result||jsonb_build_object('moderation_hours',(SELECT round(avg(extract(epoch FROM(coalesce(approved_at,rejected_at)-created_at))/3600)::numeric,1) FROM public.submissions WHERE deleted_at IS NULL AND created_at>=since AND coalesce(approved_at,rejected_at)>=created_at),'ranking',(SELECT coalesce(jsonb_agg(to_jsonb(t)),'[]') FROM(SELECT coalesce(nullif(location,''),'Local não informado') name,count(*) value FROM public.submissions WHERE deleted_at IS NULL AND created_at>=since GROUP BY 1 ORDER BY 2 DESC LIMIT 10)t),'queue',(SELECT coalesce(jsonb_agg(to_jsonb(t)),'[]') FROM(SELECT id,event_title,date,start_time,location,promotion_choice FROM public.submissions WHERE deleted_at IS NULL AND status='pendente' ORDER BY created_at LIMIT 100)t));
 ELSIF p_sector='comercial' THEN result:=result||jsonb_build_object('inventory',(SELECT coalesce(jsonb_agg(to_jsonb(t)),'[]') FROM(SELECT p.name,count(a.id) FILTER(WHERE a.status='publicado' AND (a.highlight_until IS NULL OR a.highlight_until>now())) value FROM public.ad_products p LEFT JOIN public.ads a ON a.product_id=p.id WHERE p.is_active GROUP BY p.id,p.name)t),'ads',(SELECT coalesce(jsonb_agg(to_jsonb(t)),'[]') FROM(SELECT a.title,a.status,a.highlight_until,a.target_regions,p.name product FROM public.ads a LEFT JOIN public.ad_products p ON p.id=a.product_id WHERE a.product_id IS NOT NULL ORDER BY a.created_at DESC LIMIT 100)t));
 ELSIF p_sector='marketing' THEN result:=result||jsonb_build_object('growth',(SELECT coalesce(jsonb_agg(to_jsonb(t)),'[]') FROM(SELECT (created_at AT TIME ZONE 'America/Sao_Paulo')::date::text name,count(*) value FROM public.profiles WHERE created_at>=since GROUP BY 1 ORDER BY 1)t)); END IF;
 RETURN result;
END $$;
CREATE OR REPLACE FUNCTION public.intranet_bi(p_days integer DEFAULT 30) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE since timestamptz; first_day date; today date:=(now() AT TIME ZONE 'America/Sao_Paulo')::date; received bigint; spent bigint; result jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role::text IN ('master','senior')) THEN RAISE EXCEPTION 'Visão exclusiva da diretoria' USING ERRCODE='42501'; END IF;
 IF p_days IS NULL OR p_days NOT IN (7,30,90) THEN RAISE EXCEPTION 'Período inválido'; END IF;
 first_day:=today-p_days+1; since:=first_day::timestamp AT TIME ZONE 'America/Sao_Paulo';
 SELECT coalesce(sum(amount_cents),0) INTO received FROM public.payment_records WHERE settled_at>=since;
 SELECT coalesce(sum(amount_cents),0) INTO spent FROM public.finance_expenses WHERE expense_date BETWEEN first_day AND today;
 result:=jsonb_build_object('summary',jsonb_build_object('received_cents',received,'expenses_cents',spent,'balance_cents',received-spent,'submissions',(SELECT count(*) FROM public.submissions WHERE deleted_at IS NULL AND created_at>=since),'users',(SELECT count(*) FROM public.profiles WHERE created_at>=since),'campaign_opens',(SELECT coalesce(sum(opens),0) FROM public.intranet_campaign_daily WHERE day BETWEEN first_day AND today),'won_leads',(SELECT count(*) FROM public.intranet_leads WHERE stage='ganho'),'open_operations',(SELECT count(*) FROM public.intranet_operations WHERE status<>'concluido')),
 'cashflow',(SELECT coalesce(jsonb_agg(to_jsonb(t)),'[]') FROM(SELECT d::date::text name,coalesce((SELECT sum(amount_cents) FROM public.payment_records WHERE (settled_at AT TIME ZONE 'America/Sao_Paulo')::date=d::date),0) revenue,coalesce((SELECT sum(amount_cents) FROM public.finance_expenses WHERE expense_date=d::date),0) expenses FROM generate_series(first_day::timestamp,today::timestamp,interval '1 day') d ORDER BY d)t),
 'sources',(SELECT coalesce(jsonb_agg(to_jsonb(t)),'[]') FROM(SELECT CASE WHEN p.item_type='evento' THEN coalesce(h.name,'Evento patrocinado') ELSE coalesce(pr.name,ap.name,'Espaço publicitário') END name,sum(p.amount_cents) value FROM public.payment_records p LEFT JOIN public.submissions s ON p.item_type='evento' AND s.id=p.item_id LEFT JOIN public.highlight_packages h ON h.id=s.highlight_package_id LEFT JOIN public.ads a ON p.item_type='anuncio' AND a.id=p.item_id LEFT JOIN public.ad_products pr ON pr.id=a.product_id LEFT JOIN public.ad_plans ap ON ap.id=a.highlight_plan_id WHERE p.settled_at>=since GROUP BY 1)t),
 'funnel',(SELECT coalesce(jsonb_agg(to_jsonb(t)),'[]') FROM(SELECT stage name,count(*) value FROM public.intranet_leads GROUP BY stage)t),
 'traffic',(SELECT coalesce(jsonb_agg(to_jsonb(t)),'[]') FROM(SELECT day::text name,sum(opens) value FROM public.intranet_campaign_daily WHERE day BETWEEN first_day AND today GROUP BY day ORDER BY day)t),
 'campaigns',(SELECT coalesce(jsonb_agg(to_jsonb(t)),'[]') FROM(SELECT CASE c.channel WHEN 'pago' THEN 'Pago' ELSE 'Orgânico' END name,coalesce(sum(d.opens),0) value FROM public.intranet_campaigns c LEFT JOIN public.intranet_campaign_daily d ON d.campaign_id=c.id AND d.day BETWEEN first_day AND today GROUP BY c.channel)t),
 'operations',(SELECT coalesce(jsonb_agg(to_jsonb(t)),'[]') FROM(SELECT CASE sector WHEN 'administracao' THEN 'Administração' ELSE 'Desenvolvimento' END name,count(*) FILTER(WHERE status<>'concluido') value FROM public.intranet_operations GROUP BY sector)t),
 'administration',public.intranet_dashboard('administracao',p_days), 'marketing',public.intranet_dashboard('marketing',p_days),'commercial',public.intranet_dashboard('comercial',p_days));
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.intranet_bi(integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.intranet_bi(integer) TO authenticated,service_role;
COMMENT ON TABLE public.intranet_campaign_daily IS 'Real campaign opens collected from deployment onward; not unique visitors or historical general traffic.';