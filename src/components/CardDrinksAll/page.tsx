"use client";
import {
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useObservable, useValue } from "@legendapp/state/react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { message } from "@/lib/message";
import { supabase } from "@/hooks/use-supabase.js";
import { formatCurrency } from "@/utils/formatCurrency";

interface Props {}

export const CardCommandAll = forwardRef((_: Props, ref) => {
  const totalSum$ = useObservable(0);
  const debtData$ = useObservable<Array<{ name: string; sumPrice: number }>>([]);
  const members$ = useObservable<Array<{ user_name: string; phone: string; user_email?: string }>>([]);

  const totalSum = useValue(totalSum$);
  const debtData = useValue(debtData$);
  const members = useValue(members$);

  const STORE_HANDLE = "gentlemenmc";

  const getData = async () => {
    const { data: drinks } = await supabase
      .from("bebidas")
      .select("created_at, name, drink, paid, quantity, price, user, uuid")
      .order("created_at", { ascending: false });

    const { data: membersData } = await supabase
      .from("membros")
      .select("user_name, phone, user_email");

    members$.set(membersData || []);

    const calculateSumValues = (transactions: Array<any> | null) => {
      const result: Record<string, { name: string; sumPrice: number }> = {};

      transactions?.forEach((transaction) => {
        if (!transaction) return;

        const price = Number(transaction.price);
        const isPaid =
          transaction.paid === null ||
          transaction.paid === false ||
          transaction.paid === 0;

        if (isPaid && !isNaN(price)) {
          if (!result[transaction.name]) {
            result[transaction.name] = {
              name: transaction.name,
              sumPrice: 0,
            };
          }
          result[transaction.name].sumPrice += price;
        }
      });

      return Object.values(result).sort((a, b) => b.sumPrice - a.sumPrice);
    };

    const totalSumBase = calculateSumValues(drinks);

    debtData$.set(totalSumBase);
    totalSum$.set(
      totalSumBase.reduce((acc, curr) => acc + (curr.sumPrice || 0), 0)
    );
  };

  useImperativeHandle(ref, () => ({
    refreshData: getData,
  }));

  useEffect(() => {
    getData();
  }, []);

  const shortenUrl = async (url: string): Promise<string> => {
    try {
      const response = await fetch(
        `https://tinyurl.com/api-create.php?url=${url}`
      );
      return await response.text(); // A resposta é o link encurtado direto
    } catch (error) {
      console.error("Erro ao encurtar o link:", error);
      return url; // fallback para a URL original
    }
  };

  const handleCharge = async (name: string, amount: number) => {
    const member = members.find((m) => m.user_name === name);
    if (!member) {
      message.error("Telefone do membro não encontrado.");
      return;
    }

    const cleanPhone = member.phone.replace(/\D/g, "");
    const amountInCents = Math.round(amount * 100);
    const orderNsu = crypto.randomUUID();

    // Construir manualmente os parâmetros
    const items = `[{"name":"Bebidas Gentlemen","price":${amountInCents},"quantity":1}]`;
    const redirectUrl = encodeURIComponent(
      "https://gentlemenmc.vercel.app/payment-return"
    );

    // Montar a URL sem encode nos campos que devem ser legíveis
    let paymentUrl = `https://checkout.infinitepay.io/${STORE_HANDLE}?items=${items}&order_nsu=${orderNsu}&redirect_url=${redirectUrl}&customer_name=${encodeURIComponent(
      member.user_name
    )}&customer_cellphone=55${cleanPhone}`;

    if (member.user_email) {
      paymentUrl += `&customer_email=${encodeURIComponent(member.user_email)}`;
    }

    // Encurtar o link
    const shortenedPaymentUrl = await shortenUrl(paymentUrl);

    const whatsappMessage = `Olá ${name}, segue o link para pagamento das *Bebidas Gentlemen* no valor de *${formatCurrency(
      amount
    )}*:\n\n${shortenedPaymentUrl}\n\nPode pagar via PIX ou cartão.`;

    const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
      whatsappMessage
    )}`;

    await supabase.from("charges").insert({
      order_nsu: orderNsu,
      customer_name: name,
      customer_email: member.user_email,
      customer_phone: cleanPhone,
      status: "pending",
    });

    window.open(whatsappUrl, "_blank");
  };

  return (
    <div>
      <div className="mb-4 text-lg font-semibold">
        Total não pago: {formatCurrency(totalSum)}
      </div>
      {debtData.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">Nenhuma dívida.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {debtData.map((item) => (
            <Card key={item.name}>
              <CardHeader>
                <CardTitle>{item.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Valor: {formatCurrency(item.sumPrice)}</p>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => handleCharge(item.name, item.sumPrice)}
                >
                  Cobrar via WhatsApp
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
});

CardCommandAll.displayName = "CardCommandAll";
