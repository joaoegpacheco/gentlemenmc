-- Notificações in-app (substituto seguro ao WhatsApp para empréstimos)

CREATE TABLE IF NOT EXISTS public.notificacoes_app (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  type text NOT NULL DEFAULT 'emprestimo_sede',
  reference_id uuid,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('America/Sao_Paulo'::text, now())
);

CREATE INDEX IF NOT EXISTS notificacoes_app_user_unread_idx
  ON public.notificacoes_app (user_id, read_at NULLS FIRST, created_at DESC);

ALTER TABLE public.notificacoes_app ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário lê suas notificacoes_app"
  ON public.notificacoes_app FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário marca suas notificacoes_app como lidas"
  ON public.notificacoes_app FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.notificacoes_app;
