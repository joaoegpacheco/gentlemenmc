-- Estoque global: armazém antes do estoque de consumo (bar)

CREATE TABLE IF NOT EXISTS public.estoque_global (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drink text NOT NULL,
  drink_id uuid UNIQUE REFERENCES public.drinks(id) ON DELETE CASCADE,
  quantity numeric NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  value_price numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.estoque_global_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drink text NOT NULL,
  drink_id uuid REFERENCES public.drinks(id) ON DELETE SET NULL,
  quantity integer NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['entrada'::text, 'saida'::text])),
  "user" text,
  created_at timestamptz NOT NULL DEFAULT timezone('America/Sao_Paulo'::text, now())
);

ALTER TABLE public.estoque_global ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_global_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ler estoque_global"
  ON public.estoque_global FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.admins
    WHERE admins.id = auth.uid() AND admins.role = 'admin'
  ));

CREATE POLICY "Autenticados podem ler estoque_global"
  ON public.estoque_global FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.id = auth.uid() AND admins.role = 'admin'
    ) OR true
  );

CREATE POLICY "Autenticados podem inserir estoque_global"
  ON public.estoque_global FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Autenticados podem atualizar estoque_global"
  ON public.estoque_global FOR UPDATE
  USING (true) WITH CHECK (true);

CREATE POLICY "Autenticados podem deletar estoque_global"
  ON public.estoque_global FOR DELETE
  USING (true);

CREATE POLICY "Admins podem ler estoque_global_log"
  ON public.estoque_global_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.admins
    WHERE admins.id = auth.uid() AND admins.role = 'admin'
  ));

CREATE POLICY "Autenticados podem ler estoque_global_log"
  ON public.estoque_global_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.id = auth.uid() AND admins.role = 'admin'
    ) OR true
  );

CREATE POLICY "Autenticados podem inserir estoque_global_log"
  ON public.estoque_global_log FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Transferência atômica: global → consumo
CREATE OR REPLACE FUNCTION public.transferir_estoque_global_para_consumo(
  p_drink_id uuid,
  p_quantity numeric,
  p_value_price numeric DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_global_qty numeric;
  v_global_id uuid;
  v_consumo_id uuid;
  v_user_email text;
BEGIN
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantidade inválida';
  END IF;

  SELECT coalesce(auth.jwt() ->> 'email', '') INTO v_user_email;

  SELECT id, quantity INTO v_global_id, v_global_qty
  FROM public.estoque_global
  WHERE drink_id = p_drink_id
  FOR UPDATE;

  IF v_global_id IS NULL OR v_global_qty < p_quantity THEN
    RAISE EXCEPTION 'Estoque global insuficiente';
  END IF;

  UPDATE public.estoque_global
  SET quantity = quantity - p_quantity, updated_at = now()
  WHERE id = v_global_id;

  INSERT INTO public.estoque_global_log (drink, drink_id, quantity, type, "user")
  VALUES (p_drink_id::text, p_drink_id, (-p_quantity)::integer, 'saida', v_user_email);

  SELECT id INTO v_consumo_id
  FROM public.estoque
  WHERE drink_id = p_drink_id
  FOR UPDATE;

  IF v_consumo_id IS NOT NULL THEN
    UPDATE public.estoque
    SET
      quantity = quantity + p_quantity,
      value_price = coalesce(p_value_price, value_price),
      updated_at = now()
    WHERE id = v_consumo_id;
  ELSE
    INSERT INTO public.estoque (drink, drink_id, quantity, value_price)
    VALUES (p_drink_id::text, p_drink_id, p_quantity, coalesce(p_value_price, 0));
  END IF;

  INSERT INTO public.estoque_log (drink, drink_id, quantity, type, "user")
  VALUES (p_drink_id::text, p_drink_id, p_quantity::integer, 'entrada', v_user_email);
END;
$$;

GRANT EXECUTE ON FUNCTION public.transferir_estoque_global_para_consumo(uuid, numeric, numeric)
  TO authenticated;
