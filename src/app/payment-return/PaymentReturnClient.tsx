"use client";

import { useEffect } from "react";
import { useObservable, useValue } from "@legendapp/state/react";
import { supabase } from "@/hooks/use-supabase";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Image from 'next/image';
import { CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

type Props = {
  searchParams: {
    // Novo retorno (InfinitePay / PIX)
    capture_method?: string;
    transaction_id?: string;
    transaction_nsu?: string;
    order_nsu?: string;
    slug?: string;
    receipt_url?: string;
    // Legado (mantido por compatibilidade)
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
  const status$ = useObservable<"loading" | "success" | "failed">("loading");
  const name$ = useObservable<string | null>(null);

  const status = useValue(status$);
  const name = useValue(name$);

  useEffect(() => {
    const confirmPayment = async () => {
      const {
        transaction_id,
        transaction_nsu,
        order_nsu,
        order_id,
        nsu,
        warning,
      } = searchParams;

      try {
        // Normaliza parâmetros entre novo e legado
        const normalizedOrderNsu = order_nsu || order_id || null;
        const normalizedTransactionId = transaction_nsu || transaction_id || nsu || null;

        // Verifica se o pagamento falhou
        if (warning || !normalizedOrderNsu || !normalizedTransactionId) throw new Error(warning || "Dados inválidos");

        // Atualiza cobrança
        const { error: updateError } = await supabase
          .from("charges")
          .update({ status: "paid", transaction_id: normalizedTransactionId })
          .eq("order_nsu", normalizedOrderNsu);
        if (updateError) throw updateError;

        // Busca nome do cliente
        const { data, error: selectError } = await supabase
          .from("charges")
          .select("customer_name")
          .eq("order_nsu", normalizedOrderNsu)
          .single();
        if (selectError || !data) throw selectError;

        // Marca bebidas como pagas
        const { error: bebidasError } = await supabase
          .from("bebidas")
          .update({ paid: true })
          .eq("name", data.customer_name);
        if (bebidasError) throw bebidasError;

        name$.set(data.customer_name);
        status$.set("success");
      } catch (err) {
        console.error("Erro ao confirmar pagamento:", err);
        status$.set("failed");
      }
    };

    confirmPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <Spinner className="h-12 w-12" />
        <p className="mt-4 text-lg">Verificando pagamento...</p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center px-4 space-y-6">
        <Image
          src="/images/gentlemenmc.png"
          alt="Logo GentlemenMC"
          width={200}
          height={250}
          className="object-contain"
          priority
        />
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <CardTitle>Erro ao confirmar seu pagamento</CardTitle>
            <CardDescription>
              Não foi possível confirmar sua transação. Fale diretamente com o diretor financeiro.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href="/comandas">
              <Button>Voltar ao início</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center px-4 space-y-6">
      <Image
        src="/images/gentlemenmc.png"
        alt="Logo GentlemenMC"
        width={200}
        height={200}
        className="object-contain"
        priority
      />
      <Card className="max-w-md">
        <CardHeader className="text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <CardTitle>{`Obrigado, ${name || "irmão"}!`}</CardTitle>
          <CardDescription>Seu pagamento foi confirmado com sucesso.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center gap-4">
          <Link href="/comandas">
            <Button>Voltar ao início</Button>
          </Link>
          {searchParams?.receipt_url && (
            <a href={searchParams.receipt_url} target="_blank" rel="noreferrer">
              <Button variant="outline">Ver recibo</Button>
            </a>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
