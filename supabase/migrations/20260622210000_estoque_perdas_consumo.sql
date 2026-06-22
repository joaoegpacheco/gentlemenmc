-- Perdas de estoque de consumo (bebidas não marcadas/vendidas)

CREATE TABLE IF NOT EXISTS public.estoque_perdas_consumo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drink_id uuid NOT NULL REFERENCES public.drinks(id) ON DELETE RESTRICT,
  quantity numeric NOT NULL CHECK (quantity > 0),
  cost_price numeric NOT NULL DEFAULT 0,
  price_member numeric NOT NULL DEFAULT 0,
  price_guest numeric NOT NULL DEFAULT 0,
  notes text,
  "user" text,
  created_at timestamptz NOT NULL DEFAULT timezone('America/Sao_Paulo'::text, now())
);

CREATE INDEX IF NOT EXISTS estoque_perdas_consumo_drink_id_idx
  ON public.estoque_perdas_consumo (drink_id);

CREATE INDEX IF NOT EXISTS estoque_perdas_consumo_created_at_idx
  ON public.estoque_perdas_consumo (created_at DESC);

ALTER TABLE public.estoque_perdas_consumo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ler estoque_perdas_consumo"
  ON public.estoque_perdas_consumo FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.admins
    WHERE admins.id = auth.uid() AND admins.role = 'admin'
  ));

CREATE POLICY "Autenticados podem ler estoque_perdas_consumo"
  ON public.estoque_perdas_consumo FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.id = auth.uid() AND admins.role = 'admin'
    ) OR true
  );

CREATE POLICY "Autenticados podem inserir estoque_perdas_consumo"
  ON public.estoque_perdas_consumo FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Registra perda: baixa consumo + grava snapshot de preços
CREATE OR REPLACE FUNCTION public.registrar_perda_consumo(
  p_drink_id uuid,
  p_quantity numeric,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_estoque_id uuid;
  v_estoque_qty numeric;
  v_cost numeric;
  v_member numeric;
  v_guest numeric;
  v_user_email text;
  v_perda_id uuid;
BEGIN
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantidade inválida';
  END IF;

  SELECT cost_price, price_member, price_guest
  INTO v_cost, v_member, v_guest
  FROM public.drinks
  WHERE id = p_drink_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bebida não encontrada';
  END IF;

  SELECT id, quantity INTO v_estoque_id, v_estoque_qty
  FROM public.estoque
  WHERE drink_id = p_drink_id
  FOR UPDATE;

  IF v_estoque_id IS NULL OR v_estoque_qty < p_quantity THEN
    RAISE EXCEPTION 'Estoque de consumo insuficiente';
  END IF;

  SELECT coalesce(auth.jwt() ->> 'email', '') INTO v_user_email;

  UPDATE public.estoque
  SET quantity = quantity - p_quantity, updated_at = now()
  WHERE id = v_estoque_id;

  INSERT INTO public.estoque_log (drink, drink_id, quantity, type, "user")
  VALUES (
    p_drink_id::text,
    p_drink_id,
    (-p_quantity)::integer,
    'saida',
    v_user_email || ' (perda)'
  );

  INSERT INTO public.estoque_perdas_consumo (
    drink_id, quantity, cost_price, price_member, price_guest, notes, "user"
  )
  VALUES (
    p_drink_id,
    p_quantity,
    coalesce(v_cost, 0),
    coalesce(v_member, 0),
    coalesce(v_guest, 0),
    p_notes,
    v_user_email
  )
  RETURNING id INTO v_perda_id;

  RETURN v_perda_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.registrar_perda_consumo(uuid, numeric, text)
  TO authenticated;
