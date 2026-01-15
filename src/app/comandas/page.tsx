"use client";

import React, { useEffect } from "react";
import { useTranslations } from 'next-intl';
import { useObservable, useValue } from "@legendapp/state/react";
import { useRouter } from "next/navigation";
import { notification } from "@/lib/notification";
import TabsComponent from "@/components/Tabs/page";

export default function Comandas() {
  const t = useTranslations('comandas');
  const isAuthenticated$ = useObservable(false);
  const isAuthenticated = useValue(isAuthenticated$);
  const router = useRouter();

  useEffect(() => {
    const token = document.cookie.includes("authToken");

    if (!token) {
      // Verifica se a notificação já foi exibida nesta sessão
      const hasNotified = sessionStorage.getItem("hasNotified");

      if (!hasNotified) {
        notification.error({
          message: "Você não está logado!",
        });

        sessionStorage.setItem("hasNotified", "true"); // Marca que já exibiu a notificação
      }

      router.push("/"); // Redireciona para a página de login
    } else {
      isAuthenticated$.set(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  if (!isAuthenticated) return <p>{t('loading')}</p>;

  return <TabsComponent />;
}
