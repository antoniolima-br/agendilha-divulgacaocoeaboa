CREATE OR REPLACE FUNCTION public.event_registration_pair_issue(candidate public.submissions, other public.submissions) RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE venue_name text; other_name text; same_venue boolean; same_attraction boolean;
BEGIN
 IF candidate.id IS NOT NULL AND candidate.id=other.id THEN RETURN NULL; END IF;
 IF candidate.deleted_at IS NOT NULL OR other.deleted_at IS NOT NULL OR coalesce(candidate.status,'pendente') NOT IN ('pendente','pending','aprovado','approved','publicado','published','divulgado','em_revisao','recebido') OR coalesce(other.status,'pendente') NOT IN ('pendente','pending','aprovado','approved','publicado','published','divulgado','em_revisao','recebido') OR public.event_day_sp(candidate.date) IS DISTINCT FROM public.event_day_sp(other.date) OR public.event_day_sp(candidate.date) IS NULL THEN RETURN NULL; END IF;
 venue_name:=coalesce((SELECT nome FROM public.estabelecimentos WHERE id=candidate.estabelecimento_id),candidate.location);
 other_name:=coalesce((SELECT nome FROM public.estabelecimentos WHERE id=other.estabelecimento_id),other.location);
 same_venue:=(candidate.estabelecimento_id IS NOT NULL AND candidate.estabelecimento_id=other.estabelecimento_id) OR (btrim(public.event_match_text(venue_name))<>'' AND btrim(public.event_match_text(venue_name))=btrim(public.event_match_text(other_name)) AND (nullif(btrim(candidate.address_neighborhood),'') IS NULL OR nullif(btrim(other.address_neighborhood),'') IS NULL OR btrim(public.event_match_text(candidate.address_neighborhood))=btrim(public.event_match_text(other.address_neighborhood))));
 same_attraction:=(candidate.atrativo_id IS NOT NULL AND candidate.atrativo_id=other.atrativo_id) OR (candidate.artist_id IS NOT NULL AND candidate.artist_id=other.artist_id) OR (btrim(public.event_match_text(candidate.atrativo_name))<>'' AND btrim(public.event_match_text(candidate.atrativo_name))=btrim(public.event_match_text(other.atrativo_name)));
 IF same_venue AND (public.event_titles_similar(candidate.event_title,other.event_title) OR (nullif(candidate.image_url,'') IS NOT NULL AND candidate.image_url=other.image_url) OR (nullif(candidate.flyer_fingerprint,'') IS NOT NULL AND candidate.flyer_fingerprint=other.flyer_fingerprint)) AND (same_attraction OR left(candidate.start_time,5)=left(other.start_time,5)) THEN RETURN 'DUPLICATE_EVENT'; END IF;
 IF same_venue AND left(candidate.start_time,5)=left(other.start_time,5) THEN RETURN 'DUPLICATE_EVENT_START'; END IF;
 IF candidate.promotion_choice='free' AND other.promotion_choice='free' AND (same_venue OR same_attraction) THEN RETURN 'FREE_DAILY_QUOTA'; END IF;
 RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.event_registration_pair_issue(public.submissions, public.submissions) FROM PUBLIC,anon,authenticated;

-- VOLATILE uses fresh snapshots after advisory locks and sees earlier rows of a multi-row insert.
CREATE OR REPLACE FUNCTION public.event_registration_issue(candidate public.submissions) RETURNS text LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=public AS $$
DECLARE other public.submissions; issue text; day date;
BEGIN
 day:=public.event_day_sp(candidate.date);
 IF day IS NULL OR candidate.deleted_at IS NOT NULL OR coalesce(candidate.status,'pendente') NOT IN ('pendente','pending','aprovado','approved','publicado','published','divulgado','em_revisao','recebido') THEN RETURN NULL; END IF;
 FOR other IN SELECT s.* FROM public.submissions s WHERE s.id IS DISTINCT FROM candidate.id AND s.deleted_at IS NULL AND s.status IN ('pendente','pending','aprovado','approved','publicado','published','divulgado','em_revisao','recebido') AND public.event_day_sp(s.date)=day LOOP
  issue:=public.event_registration_pair_issue(candidate,other);
  IF issue IS NOT NULL THEN RETURN issue; END IF;
 END LOOP;
 RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.event_registration_issue(public.submissions) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.check_event_registration(p_events jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE item jsonb; prior_item jsonb; candidate public.submissions; prior public.submissions; issue text; idx integer:=0; processed jsonb:='[]'::jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT public.can_create_events(auth.uid()) THEN RAISE EXCEPTION 'Sem permissão para cadastrar eventos' USING ERRCODE='42501'; END IF;
 IF p_events IS NULL OR jsonb_typeof(p_events)<>'array' THEN RAISE EXCEPTION 'Lote de eventos inválido'; END IF;
 IF jsonb_array_length(p_events) NOT BETWEEN 1 AND 11 THEN RAISE EXCEPTION 'Lote de eventos inválido'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(p_events) LOOP
  candidate:=jsonb_populate_record(NULL::public.submissions,item);
  candidate.id:=NULL; candidate.user_id:=auth.uid(); candidate.status:='pendente'; candidate.deleted_at:=NULL;
  FOR prior_item IN SELECT value FROM jsonb_array_elements(processed) LOOP
   prior:=jsonb_populate_record(NULL::public.submissions,prior_item);
   issue:=public.event_registration_pair_issue(candidate,prior);
   IF issue IS NOT NULL THEN RETURN jsonb_build_object('code',issue,'index',idx); END IF;
  END LOOP;
  issue:=public.event_registration_issue(candidate);
  IF issue IS NOT NULL THEN RETURN jsonb_build_object('code',issue,'index',idx); END IF;
  processed:=processed||jsonb_build_array(to_jsonb(candidate));
  idx:=idx+1;
 END LOOP;
 RETURN jsonb_build_object('code',NULL);
END $$;
REVOKE ALL ON FUNCTION public.check_event_registration(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.check_event_registration(jsonb) TO authenticated;