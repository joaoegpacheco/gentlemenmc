import { supabase } from "@/hooks/use-supabase.js";
import { notification } from "antd";

type Props = {
  searchParams: {
    order_nsu: string;
    customer_name: string;
    customer_email?: string;
    slug?: string;
  };
};

export default async function PaymentReturn({ searchParams }: Props) {
  const { order_nsu, customer_name, slug } = searchParams;

  const payload = {
    handle: "gentlemenmc", // Identificador na InfinitePay
    external_order_nsu: order_nsu,
    slug: slug,
  };

  const response = await fetch("https://api.infinitepay.io/invoices/public/checkout/payment_check/gentlemenmc", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const result = await response.json();

  if (result.success && result?.paid) {
    await supabase
      .from("bebidas")
      .update({ paid: true })
      .eq("name", customer_name);;

      notification.success({
            message: "Pagamento confirmado com sucesso!",
          });
  } else {
          notification.warning({
            message: "Pagamento não foi confirmado ainda.",
          });
        }

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>{result?.paid ? "✅ Pagamento confirmado!" : "⏳ Pagamento ainda não confirmado."}</h1>
      <p>{customer_name ? `Obrigado, ${customer_name}.` : "Usuário não identificado."}</p>
    </div>
  );
}
