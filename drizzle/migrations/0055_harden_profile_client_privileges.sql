REVOKE DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.profiles FROM anon, authenticated;
DO $audit$
BEGIN
  IF has_table_privilege('authenticated', 'public.profiles', 'DELETE') OR has_table_privilege('anon', 'public.profiles', 'DELETE') THEN
    RAISE EXCEPTION 'Client profile deletion must stay disabled';
  END IF;
  IF NOT has_table_privilege('authenticated', 'public.profiles', 'SELECT') OR NOT has_table_privilege('authenticated', 'public.profiles', 'UPDATE') OR NOT has_table_privilege('service_role', 'public.profiles', 'DELETE') THEN
    RAISE EXCEPTION 'Profile read/update and trusted account deletion must remain available';
  END IF;
END;
$audit$;