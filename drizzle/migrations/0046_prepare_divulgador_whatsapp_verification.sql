ALTER TABLE public.divulgador_requests
  ADD COLUMN IF NOT EXISTS identity_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'aguardando_integracao';

ALTER TABLE public.divulgador_requests
  ADD CONSTRAINT divulgador_requests_verification_status_check
  CHECK (verification_status IN ('aguardando_integracao', 'codigo_enviado', 'confirmado', 'expirado', 'bloqueado')) NOT VALID;

CREATE TABLE public.divulgador_verification_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.divulgador_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  phone_e164 TEXT NOT NULL CHECK (phone_e164 ~ '^55[0-9]{10,11}$'),
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 5),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.divulgador_verification_challenges TO service_role;

ALTER TABLE public.divulgador_verification_challenges ENABLE ROW LEVEL SECURITY;

CREATE INDEX divulgador_verification_challenges_request_idx
  ON public.divulgador_verification_challenges(request_id, created_at DESC);

CREATE INDEX divulgador_verification_challenges_expiry_idx
  ON public.divulgador_verification_challenges(expires_at)
  WHERE verified_at IS NULL;

CREATE OR REPLACE FUNCTION public.apply_divulgador_request_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.status = 'aprovado' AND OLD.status IS DISTINCT FROM 'aprovado' THEN
    IF NOT public.is_admin_or_master(auth.uid()) THEN
      RAISE EXCEPTION 'Apenas administradores podem aprovar solicitações';
    END IF;
    IF NEW.verification_status IS DISTINCT FROM 'confirmado' OR NEW.identity_verified_at IS NULL THEN
      RAISE EXCEPTION 'Confirmação de identidade pelo WhatsApp pendente';
    END IF;
    UPDATE public.profiles SET user_type = 'divulgador' WHERE user_id = NEW.user_id;
    INSERT INTO public.app_notifications (user_id, type, title, body, link, entity_table, entity_id)
    VALUES (NEW.user_id, 'divulgador_request_approved', 'Boa! Agora você é Divulgador',
            'Já pode cadastrar e divulgar seus eventos.', '/enviar-evento',
            'divulgador_requests', NEW.id);
  ELSIF NEW.status = 'recusado' AND OLD.status IS DISTINCT FROM 'recusado' THEN
    INSERT INTO public.app_notifications (user_id, type, title, body, link, entity_table, entity_id)
    VALUES (NEW.user_id, 'divulgador_request_rejected', 'Pedido de Divulgador não aprovado',
            COALESCE(NEW.admin_notes, 'Fala com a gente pra entender o próximo passo.'), '/perfil',
            'divulgador_requests', NEW.id);
  END IF;
  RETURN NEW;
END;
$function$;