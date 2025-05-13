"use client";
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { notification } from "antd";
import { supabase } from "@/hooks/use-supabase";

const STORE_HANDLE = "gentlemenmc";

export default function PaymentConfirmation() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const checkPayment = async () => {
      const transaction_nsu = searchParams.get("transaction_nsu");
      const external_order_nsu = searchParams.get("external_order_nsu");
      const slug = searchParams.get("slug");

      if (!transaction_nsu || !external_order_nsu || !slug) {
        notification.error({ message: "Parâmetros inválidos no retorno do pagamento." });
        router.push("/");
        return;
      }

      try {
        const response = await fetch(
          `https://api.infinitepay.io/invoices/public/checkout/payment_check/${STORE_HANDLE}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              transaction_nsu,
              external_order_nsu,
              slug,
            }),
          }
        );

        const result = await response.json();

        if (result.success && result.paid) {
          // Atualiza o status da transação no Supabase
          await supabase
            .from("bebidas")
            .update({ paid: true })
            .eq("uuid", external_order_nsu);

          notification.success({ message: "Pagamento confirmado com sucesso!" });
        } else {
          notification.warning({ message: "Pagamento ainda não foi confirmado." });
        }
      } catch (error) {
        console.error("Erro ao verificar pagamento:", error);
        notification.error({ message: "Erro ao verificar o pagamento." });
      } finally {
        router.push("/comandas");
      }
    };

    checkPayment();
  }, [searchParams, router]);

  return <p>Verificando pagamento...</p>;
}
