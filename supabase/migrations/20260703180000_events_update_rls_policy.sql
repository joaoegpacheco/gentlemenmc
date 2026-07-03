-- A política de UPDATE tinha USING NULL, bloqueando todas as atualizações silenciosamente.
DROP POLICY IF EXISTS "Permitir inserir de arquivos para usuários autenticados" ON public.events;

CREATE POLICY "Permitir atualizar para usuários autenticados"
  ON public.events FOR UPDATE
  USING (auth.role() = 'authenticated'::text)
  WITH CHECK (auth.role() = 'authenticated'::text);
