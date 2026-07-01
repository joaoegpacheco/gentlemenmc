-- reference_id precisa aceitar IDs de eventos (bigint) e empréstimos (uuid)

ALTER TABLE public.notificacoes_app
  ALTER COLUMN reference_id TYPE text USING reference_id::text;

CREATE INDEX IF NOT EXISTS notificacoes_app_user_type_ref_idx
  ON public.notificacoes_app (user_id, type, reference_id);
