-- Empréstimo de ferramentas e utensílios da Sede

CREATE TABLE IF NOT EXISTS public.emprestimos_sede (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  item_description text NOT NULL,
  sector text NOT NULL,
  photo_url text NOT NULL,
  agreed_to_policy boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('America/Sao_Paulo'::text, now())
);

CREATE INDEX IF NOT EXISTS emprestimos_sede_created_at_idx
  ON public.emprestimos_sede (created_at DESC);

CREATE INDEX IF NOT EXISTS emprestimos_sede_user_id_idx
  ON public.emprestimos_sede (user_id);

ALTER TABLE public.emprestimos_sede ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem ler emprestimos_sede"
  ON public.emprestimos_sede FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Autenticados podem inserir emprestimos_sede"
  ON public.emprestimos_sede FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.uid() = user_id
    AND agreed_to_policy = true
  );

-- Bucket de fotos dos empréstimos
INSERT INTO storage.buckets (id, name, public)
VALUES ('emprestimos_sede', 'emprestimos_sede', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Autenticados podem fazer upload em emprestimos_sede"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'emprestimos_sede'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Todos podem ver fotos de emprestimos_sede"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'emprestimos_sede');
