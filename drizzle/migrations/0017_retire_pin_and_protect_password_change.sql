CREATE OR REPLACE FUNCTION public.guard_password_change_flag()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role' THEN
    IF TG_OP = 'INSERT' AND NEW.must_change_password = true THEN
      RAISE EXCEPTION 'Password change state is managed by the server' USING ERRCODE = '42501';
    ELSIF TG_OP = 'UPDATE' AND NEW.must_change_password IS DISTINCT FROM OLD.must_change_password THEN
      RAISE EXCEPTION 'Complete the secure password change first' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_password_change_flag() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guard_password_change_flag() TO service_role;
CREATE TRIGGER guard_password_change_flag BEFORE INSERT OR UPDATE OF must_change_password ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.guard_password_change_flag();
REVOKE EXECUTE ON FUNCTION public.set_user_pin(text,text), public.user_pin_status(), public.verify_user_pin_for_reset(uuid,text), public.create_admin_pin_session(text), public.verify_admin_pin_session(uuid), public.revoke_admin_pin_session(uuid), public.reset_admin_pin_as_master(uuid), public.setup_admin_pin(text), public.update_admin_pin(text,text), public.verify_admin_pin(text), public.reset_admin_pin_with_password(text,text), public.admin_pin_status() FROM PUBLIC, anon, authenticated;
COMMENT ON TABLE public.user_pins IS 'DEPRECATED: PIN login and recovery retired; use assisted WhatsApp password recovery';
COMMENT ON TABLE public.admin_pin_sessions IS 'DEPRECATED: PIN access retired; access uses authenticated roles';