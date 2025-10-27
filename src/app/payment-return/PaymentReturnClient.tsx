"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/hooks/use-supabase";
import { Result, Button, Spin } from "antd";
import Image from 'next/image';
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from "@ant-design/icons";
import Link from "next/link";

type Props = {
  searchParams: {
    order_id?: string;
    nsu?: string;
    aut?: string;
    card_brand?: string;
    handle?: string;
    merchant_document?: string;
    warning?: string;
  };
};

export default function PaymentReturnClient({ searchParams }: Props) {
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    const confirmPayment = async () => {
      const { order_id, nsu, warning } = searchParams;

      try {
        // Verifica se o pagamento falhou
        if (warning || !nsu || !order_id) throw new Error(warning || "Dados inválidos");

        // Atualiza cobrança
        const { error: updateError } = await supabase
          .from("charges")
          .update({ status: "paid", transaction_id: nsu })
          .eq("order_nsu", order_id);
        if (updateError) throw updateError;

        // Busca nome do cliente
        const { data, error: selectError } = await supabase
          .from("charges")
          .select("customer_name")
          .eq("order_nsu", order_id)
          .single();
        if (selectError || !data) throw selectError;

        // Marca bebidas como pagas
        const { error: bebidasError } = await supabase
          .from("bebidas")
          .update({ paid: true })
          .eq("name", data.customer_name);
        if (bebidasError) throw bebidasError;

        setName(data.customer_name);
        setStatus("success");
      } catch (err) {
        console.error("Erro ao confirmar pagamento:", err);
        setStatus("failed");
      }
    };

    confirmPayment();
  }, [searchParams]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
        <p className="mt-4 text-lg">Verificando pagamento...</p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center px-4">
        <Image
          src="/images/gentlemenmc.png"
          alt="Página não encontrada"
          width={200}
          height={200}
          style={{
            objectFit: "contain", // Garante que a imagem não distorça
          }}
        />
        <Result
          status="error"
          title="Erro ao confirmar o pagamento"
          subTitle="Não foi possível confirmar sua transação. Verifique com o operador ou tente novamente."
          icon={<CloseCircleOutlined style={{ color: "#ff4d4f" }} />}
          extra={[
            <Link href="/" key="home">
              <Button type="primary">Voltar ao início</Button>
            </Link>,
          ]}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center px-4">
      <Result
        status="success"
        title={`Obrigado, ${name || "cliente"}!`}
        subTitle="Seu pagamento foi confirmado com sucesso."
        icon={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
        extra={[
          <Link href="/" key="home">
            <Button type="primary">Voltar ao início</Button>
          </Link>,
        ]}
      />
      <footer className="mt-8 text-sm text-gray-500">
        <p>GentlemenMC © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
