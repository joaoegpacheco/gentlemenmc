-- Remove função de importação incorreta (consumo ≠ global; consumo já saiu do armazém)

DROP FUNCTION IF EXISTS public.popular_estoque_global_do_consumo();
