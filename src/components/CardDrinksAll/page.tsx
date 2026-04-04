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
import { useTranslations } from 'next-intl';

interface Props {}

export const CardCommandAll = forwardRef((_: Props, ref) => {
  const t = useTranslations('cardDrinksAll');
  const totalSum$ = useObservable(0);
  const debtData$ = useObservable<Array<{ name: string; sumPrice: number }>>([]);
  const members$ = useObservable<Array<{ user_name: string; phone: string; user_email?: string }>>([]);

  const totalSum = useValue(totalSum$);
  const debtData = useValue(debtData$);
  const members = useValue(members$);

  const STORE_HANDLE = "gentlemenmc";

  const getData = async () => {
    try {
      const [debtRes, membersRes] = await Promise.all([
        fetch("/api/bebidas/debt-summary"),
        supabase.from("membros").select("user_name, phone, user_email"),
      ]);

      if (!debtRes.ok) {
        message.error(t("errorLoadingDebts"));
        debtData$.set([]);
        totalSum$.set(0);
        members$.set(membersRes.data || []);
        return;
      }

      const debtSummary: Array<{ name: string; sumPrice: number }> =
        await debtRes.json();

      if (membersRes.error) {
        console.error(membersRes.error);
        message.error(t("errorLoadingMembers"));
      }

      members$.set(membersRes.data || []);
      debtData$.set(Array.isArray(debtSummary) ? debtSummary : []);
      totalSum$.set(
        (Array.isArray(debtSummary) ? debtSummary : []).reduce(
          (acc, curr) => acc + (curr.sumPrice || 0),
          0
        )
      );
    } catch (e) {
      console.error(e);
      message.error(t("errorLoadingDebts"));
      debtData$.set([]);
      totalSum$.set(0);
    }
  };

  useImperativeHandle(ref, () => ({
    refreshData: getData,
  }));

  useEffect(() => {
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shortenUrl = async (url: string): Promise<string> => {
    try {
      const response = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!response.ok) return url;
      const data = (await response.json()) as { shortUrl?: string };
      return data.shortUrl?.trim() || url;
    } catch (error) {
      console.error("Erro ao encurtar o link:", error);
      return url;
    }
  };

  const handleCharge = async (name: string, amount: number) => {
    const member = members.find((m) => m.user_name === name);
    if (!member) {
      message.error(t('memberPhoneNotFound'));
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
        {t('unpaidTotal')} {formatCurrency(totalSum)}
      </div>
      {debtData.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">{t('noDebts')}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {debtData.map((item) => (
            <Card key={item.name}>
              <CardHeader>
                <CardTitle>{item.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{t('value')} {formatCurrency(item.sumPrice)}</p>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => handleCharge(item.name, item.sumPrice)}
                >
                  {t('chargeViaWhatsApp')}
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
