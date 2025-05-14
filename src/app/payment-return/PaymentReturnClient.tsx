"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/hooks/use-supabase";

type Props = {
  searchParams: {
    transaction_id: string;
    order_nsu: string;
    slug: string;
  };
};

export default function PaymentReturnClient({ searchParams }: Props) {
  const [status, setStatus] = useState<"loading" | "success" | "failed">(
    "loading"
  );
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    const confirmPayment = async () => {
      const { transaction_id, order_nsu, slug } = searchParams;

      try {
        // 1. Consultar API InfinitePay
        const res = await fetch(
          `https://api.infinitepay.io/invoices/public/checkout/payment_check/gentlemenmc`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              transaction_nsu: transaction_id,
              external_order_nsu: order_nsu,
              slug,
            }),
          }
        );

        const result = await res.json();

        if (result.success && result.paid) {
          // 2. Atualiza status da cobrança no Supabase
          await supabase
            .from("charges")
            .update({ status: "paid", transaction_id, slug })
            .eq("order_nsu", order_nsu);

          // 3. Busca o nome do cliente
          const { data, error } = await supabase
            .from("charges")
            .select("customer_name")
            .eq("order_nsu", order_nsu)
            .single();

          // 4. Atualiza as bebidas como pagas
          await supabase
            .from("bebidas")
            .update({ paid: true })
            .eq("name", data?.customer_name);

          if (!error && data) {
            setName(data.customer_name);
            setStatus("success");
          } else {
            throw new Error("Nome não encontrado");
          }
        } else {
          throw new Error("Pagamento não confirmado");
        }
      } catch (error) {
        console.error(error);
        setStatus("failed");
      }
    };

    confirmPayment();
  }, [searchParams]);

  if (status === "loading") return <p>Verificando pagamento...</p>;
  if (status === "failed") return <p>Erro ao confirmar o pagamento.</p>;
  return <h1>Obrigado, {name}! Pagamento confirmado com sucesso. ✅</h1>;
}
