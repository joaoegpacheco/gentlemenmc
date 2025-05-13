"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/hooks/use-supabase";
import { notification } from "antd";

export default function PaymentReturn() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPayment = async () => {
      const orderNSU = searchParams.get("order_nsu");
      const userName = searchParams.get("customer_name"); // se tiver incluído no link
      if (!orderNSU) return;

      try {
        const res = await fetch(
          `https://api.infinitepay.io/invoices/public/checkout/payment_check/gentlemenmc?external_order_nsu=${orderNSU}`
        );
        const result = await res.json();

        if (result.success && result.paid) {
          // Marca como pago no Supabase
          await supabase
            .from("bebidas")
            .update({ paid: true })
            .eq("name", userName);

          notification.success({
            message: "Pagamento confirmado com sucesso!",
          });
        } else {
          notification.warning({
            message: "Pagamento não foi confirmado ainda.",
          });
        }
      } catch (error) {
        console.error("Erro ao verificar pagamento:", error);
        notification.error({ message: "Erro ao verificar pagamento." });
      } finally {
        setLoading(false);
        router.push("/comandas");
      }
    };

    checkPayment();
  }, [searchParams, router]);

  return <p>{loading ? "Verificando pagamento..." : "Redirecionando..."}</p>;
}
