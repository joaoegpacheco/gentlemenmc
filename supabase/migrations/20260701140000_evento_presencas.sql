-- Confirmação de presença em eventos (RSVP)

CREATE TABLE IF NOT EXISTS public.evento_presencas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id bigint NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('confirmed', 'declined')),
  guest_names text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT timezone('America/Sao_Paulo'::text, now()),
  created_at timestamptz NOT NULL DEFAULT timezone('America/Sao_Paulo'::text, now()),
  UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS evento_presencas_event_id_idx
  ON public.evento_presencas (event_id);

CREATE INDEX IF NOT EXISTS evento_presencas_user_id_idx
  ON public.evento_presencas (user_id);

ALTER TABLE public.evento_presencas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário lê sua presença em eventos"
  ON public.evento_presencas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário confirma ou declina presença"
  ON public.evento_presencas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário atualiza sua presença"
  ON public.evento_presencas FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
