-- Devolução de empréstimos da Sede

ALTER TABLE public.emprestimos_sede
  ADD COLUMN IF NOT EXISTS returned_at timestamptz,
  ADD COLUMN IF NOT EXISTS return_photo_url text,
  ADD COLUMN IF NOT EXISTS returned_by_user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS returned_by_user_name text;

CREATE INDEX IF NOT EXISTS emprestimos_sede_returned_at_idx
  ON public.emprestimos_sede (returned_at DESC NULLS LAST);

CREATE POLICY "Autenticados podem concluir emprestimos_sede"
  ON public.emprestimos_sede FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    AND returned_at IS NULL
  )
  WITH CHECK (
    auth.role() = 'authenticated'
    AND returned_at IS NOT NULL
    AND return_photo_url IS NOT NULL
    AND returned_by_user_id = auth.uid()
  );
