ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS flyer_fingerprint text;

CREATE OR REPLACE FUNCTION public.event_match_text(v text) RETURNS text LANGUAGE sql IMMUTABLE SET search_path=public AS $$ SELECT regexp_replace(translate(lower(btrim(coalesce(v,''))), 'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn'), '[^a-z0-9]+', ' ', 'g') $$;
CREATE OR REPLACE FUNCTION public.event_titles_similar(a text,b text) RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path=public AS $$
WITH x AS (SELECT btrim(public.event_match_text(a)) a, btrim(public.event_match_text(b)) b), words AS (SELECT ARRAY(SELECT DISTINCT w FROM unnest(string_to_array(x.a,' ')) w WHERE length(w)>2) aa, ARRAY(SELECT DISTINCT w FROM unnest(string_to_array(x.b,' ')) w WHERE length(w)>2) bb FROM x)
SELECT EXISTS(SELECT 1 FROM x WHERE a<>'' AND a=b) OR EXISTS(SELECT 1 FROM words WHERE cardinality(aa)>=2 AND cardinality(bb)>=2 AND (SELECT count(*) FROM unnest(aa) w WHERE w=ANY(bb))::numeric / greatest(cardinality(aa),cardinality(bb)) >= 0.8) $$;

CREATE OR REPLACE FUNCTION public.event_registration_issue(candidate public.submissions) RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE other public.submissions; venue_name text; other_name text; same_venue boolean; same_attraction boolean; day date;
BEGIN
 day:=public.event_day_sp(candidate.date);
 IF day IS NULL OR candidate.deleted_at IS NOT NULL OR coalesce(candidate.status,'pendente') NOT IN ('pendente','pending','aprovado','approved','publicado','published','divulgado','em_revisao','recebido') THEN RETURN NULL; END IF;
 venue_name:=coalesce((SELECT nome FROM public.estabelecimentos WHERE id=candidate.estabelecimento_id),candidate.location);
 FOR other IN SELECT s.* FROM public.submissions s WHERE s.id IS DISTINCT FROM candidate.id AND s.deleted_at IS NULL AND s.status IN ('pendente','pending','aprovado','approved','publicado','published','divulgado','em_revisao','recebido') AND public.event_day_sp(s.date)=day LOOP
  other_name:=coalesce((SELECT nome FROM public.estabelecimentos WHERE id=other.estabelecimento_id),other.location);
  same_venue:=(candidate.estabelecimento_id IS NOT NULL AND candidate.estabelecimento_id=other.estabelecimento_id) OR (btrim(public.event_match_text(venue_name))<>'' AND btrim(public.event_match_text(venue_name))=btrim(public.event_match_text(other_name)) AND (nullif(btrim(candidate.address_neighborhood),'') IS NULL OR nullif(btrim(other.address_neighborhood),'') IS NULL OR btrim(public.event_match_text(candidate.address_neighborhood))=btrim(public.event_match_text(other.address_neighborhood))));
  same_attraction:=(candidate.atrativo_id IS NOT NULL AND candidate.atrativo_id=other.atrativo_id) OR (candidate.artist_id IS NOT NULL AND candidate.artist_id=other.artist_id) OR (btrim(public.event_match_text(candidate.atrativo_name))<>'' AND btrim(public.event_match_text(candidate.atrativo_name))=btrim(public.event_match_text(other.atrativo_name)));
  IF same_venue AND (public.event_titles_similar(candidate.event_title,other.event_title) OR (nullif(candidate.image_url,'') IS NOT NULL AND candidate.image_url=other.image_url) OR (nullif(candidate.flyer_fingerprint,'') IS NOT NULL AND candidate.flyer_fingerprint=other.flyer_fingerprint)) AND (same_attraction OR left(candidate.start_time,5)=left(other.start_time,5)) THEN RETURN 'DUPLICATE_EVENT'; END IF;
  IF same_venue AND left(candidate.start_time,5)=left(other.start_time,5) THEN RETURN 'DUPLICATE_EVENT_START'; END IF;
  IF candidate.promotion_choice='free' AND other.promotion_choice='free' AND (same_venue OR same_attraction) THEN RETURN 'FREE_DAILY_QUOTA'; END IF;
 END LOOP;
 RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.event_registration_issue(public.submissions) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.check_event_registration(p_events jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE item jsonb; candidate public.submissions; issue text; idx integer:=0;
BEGIN
 IF auth.uid() IS NULL OR NOT public.can_create_events(auth.uid()) THEN RAISE EXCEPTION 'Sem permissão para cadastrar eventos' USING ERRCODE='42501'; END IF;
 IF jsonb_typeof(p_events)<>'array' OR jsonb_array_length(p_events) NOT BETWEEN 1 AND 11 THEN RAISE EXCEPTION 'Lote de eventos inválido'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(p_events) LOOP
 candidate:=jsonb_populate_record(NULL::public.submissions,item);
 candidate.id:=NULL; candidate.user_id:=auth.uid(); candidate.status:='pendente'; candidate.deleted_at:=NULL;
 issue:=public.event_registration_issue(candidate);
 IF issue IS NOT NULL THEN RETURN jsonb_build_object('code',issue,'index',idx); END IF;
 idx:=idx+1;
 END LOOP;
 RETURN jsonb_build_object('code',NULL);
END $$;
REVOKE ALL ON FUNCTION public.check_event_registration(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.check_event_registration(jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_event_registration() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE issue text;
BEGIN
 IF TG_OP='UPDATE' THEN
 IF ROW(NEW.date,NEW.start_time,NEW.event_title,NEW.image_url,NEW.flyer_fingerprint,NEW.location,NEW.estabelecimento_id,NEW.atrativo_id,NEW.artist_id,NEW.atrativo_name,NEW.promotion_choice,NEW.deleted_at) IS NOT DISTINCT FROM ROW(OLD.date,OLD.start_time,OLD.event_title,OLD.image_url,OLD.flyer_fingerprint,OLD.location,OLD.estabelecimento_id,OLD.atrativo_id,OLD.artist_id,OLD.atrativo_name,OLD.promotion_choice,OLD.deleted_at) AND (OLD.status IN ('pendente','pending','aprovado','approved','publicado','published','divulgado','em_revisao','recebido') OR NEW.status NOT IN ('pendente','pending','aprovado','approved','publicado','published','divulgado','em_revisao','recebido')) THEN RETURN NEW; END IF;
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('event-registration:'||coalesce(public.event_day_sp(NEW.date)::text,''),0));
 issue:=public.event_registration_issue(NEW);
 IF issue IS NOT NULL THEN RAISE EXCEPTION '%',issue USING ERRCODE='P0001'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_event_registration() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER aaa_guard_event_registration BEFORE INSERT OR UPDATE ON public.submissions FOR EACH ROW EXECUTE FUNCTION public.guard_event_registration();