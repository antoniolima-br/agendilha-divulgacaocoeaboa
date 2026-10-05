CREATE OR REPLACE FUNCTION public.guard_submission_privileged_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_can_approve boolean;
  v_is_admin boolean;
BEGIN
  v_is_admin := public.is_admin_or_master(auth.uid());
  SELECT EXISTS (
    SELECT 1
    FROM public.collaborators c
    WHERE c.user_id = auth.uid()
      AND c.is_active = true
      AND c.can_approve = true
  ) INTO v_can_approve;

  IF NOT v_is_admin THEN
    NEW.is_highlight := OLD.is_highlight;
    NEW.highlight_package_id := OLD.highlight_package_id;
    NEW.highlight_starts_at := OLD.highlight_starts_at;
    NEW.highlight_until := OLD.highlight_until;
    NEW.highlight_hidden := OLD.highlight_hidden;
    NEW.highlight_grant_type := OLD.highlight_grant_type;
    NEW.approved_by := OLD.approved_by;
    NEW.approved_at := OLD.approved_at;
    NEW.published_at := OLD.published_at;
    NEW.rejected_by := OLD.rejected_by;
    NEW.rejected_at := OLD.rejected_at;
    NEW.editorial_status := OLD.editorial_status;

    IF NOT v_can_approve THEN
      NEW.status := OLD.status;
      NEW.moderation_status := OLD.moderation_status;
      NEW.rejection_reason := OLD.rejection_reason;
      NEW.admin_notes := OLD.admin_notes;
      NEW.flyer_aprovado := OLD.flyer_aprovado;
      NEW.flyer_approved_at := OLD.flyer_approved_at;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_submission_privileged_fields() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guard_submission_privileged_fields() TO service_role;

CREATE TRIGGER guard_submission_privileged_fields_before_update
BEFORE UPDATE ON public.submissions
FOR EACH ROW
EXECUTE FUNCTION public.guard_submission_privileged_fields();

ALTER FUNCTION public.contains_bad_words(text) SET search_path = public;

REVOKE ALL ON FUNCTION public.process_expired_highlights() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_expired_highlights() TO service_role;

REVOKE ALL ON FUNCTION public.cleanup_admin_pin_sessions() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_admin_pin_sessions() TO service_role;

REVOKE ALL ON FUNCTION public.cleanup_expired_reset_codes() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_reset_codes() TO service_role;

REVOKE ALL ON FUNCTION public.resolve_user_id_by_email(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_user_id_by_email(text) TO service_role;

REVOKE ALL ON FUNCTION public.verify_user_pin_for_reset(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_user_pin_for_reset(uuid, text) TO service_role;

REVOKE ALL ON FUNCTION public.log_administrative_action() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_administrative_action() TO service_role;

REVOKE ALL ON FUNCTION public.log_profile_phone_change() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_profile_phone_change() TO service_role;

REVOKE ALL ON FUNCTION public.ads_guard_moderation_fields() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ads_guard_moderation_fields() TO service_role;

REVOKE ALL ON FUNCTION public.notify_ad_owner_on_publication() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notify_ad_owner_on_publication() TO service_role;

REVOKE ALL ON FUNCTION public.notify_admins_on_change_request() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notify_admins_on_change_request() TO service_role;

REVOKE ALL ON FUNCTION public.notify_admins_on_divulgador_request() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notify_admins_on_divulgador_request() TO service_role;

REVOKE ALL ON FUNCTION public.notify_admins_on_new_atrativo() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notify_admins_on_new_atrativo() TO service_role;

REVOKE ALL ON FUNCTION public.notify_admins_on_new_submission() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notify_admins_on_new_submission() TO service_role;

REVOKE ALL ON FUNCTION public.notify_highlight_changes_ads() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notify_highlight_changes_ads() TO service_role;

REVOKE ALL ON FUNCTION public.notify_highlight_changes_submissions() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notify_highlight_changes_submissions() TO service_role;

REVOKE ALL ON FUNCTION public.enforce_attraction_schedule_gap() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_attraction_schedule_gap() TO service_role;

REVOKE ALL ON FUNCTION public.prevent_duplicate_event_start_at_same_establishment() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prevent_duplicate_event_start_at_same_establishment() TO service_role;

REVOKE ALL ON FUNCTION public.keep_event_review_author() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.keep_event_review_author() TO service_role;

REVOKE ALL ON FUNCTION public.sync_admin_pin_to_user_pin() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_admin_pin_to_user_pin() TO service_role;

REVOKE ALL ON FUNCTION public.validate_highlight_payment_confirmation() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_highlight_payment_confirmation() TO service_role;

REVOKE ALL ON FUNCTION public.check_atrativo_category_restriction() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_atrativo_category_restriction() TO service_role;

REVOKE ALL ON FUNCTION public.enforce_artist_representative_name() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_artist_representative_name() TO service_role;