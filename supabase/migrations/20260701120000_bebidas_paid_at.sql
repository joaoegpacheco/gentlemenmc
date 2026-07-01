ALTER TABLE public.bebidas
ADD COLUMN IF NOT EXISTS paid_at timestamptz;

UPDATE public.bebidas
SET paid_at = created_at
WHERE paid IS TRUE
  AND paid_at IS NULL;

CREATE OR REPLACE FUNCTION public.set_bebidas_paid_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.paid IS TRUE AND (TG_OP = 'INSERT' OR OLD.paid IS DISTINCT FROM TRUE) THEN
    NEW.paid_at := timezone('America/Sao_Paulo', now());
  ELSIF NEW.paid IS NOT TRUE THEN
    NEW.paid_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bebidas_paid_at_trigger ON public.bebidas;

CREATE TRIGGER bebidas_paid_at_trigger
BEFORE INSERT OR UPDATE OF paid ON public.bebidas
FOR EACH ROW
EXECUTE FUNCTION public.set_bebidas_paid_at();
