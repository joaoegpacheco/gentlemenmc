"use client";

import React, { useEffect } from "react";
import { useObservable, useValue } from "@legendapp/state/react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import { notification } from "@/lib/notification";
import TabsComponent from "@/components/Tabs/page";

export default function Comandas() {
  const isAuthenticated$ = useObservable(false);
  const isAuthenticated = useValue(isAuthenticated$);
  const router = useRouter();
  const t = useTranslations('comandas');
  const tCommon = useTranslations('common');

  useEffect(() => {
    const token = document.cookie.includes("authToken");

    if (!token) {
      // Verifica se a notificação já foi exibida nesta sessão
      const hasNotified = sessionStorage.getItem("hasNotified");

      if (!hasNotified) {
        notification.error({
          message: t('notLoggedIn'),
        });

        sessionStorage.setItem("hasNotified", "true"); // Marca que já exibiu a notificação
      }

      router.push("/"); // Redireciona para a página de login
    } else {
      isAuthenticated$.set(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  if (!isAuthenticated) return <p>{tCommon('loading')}</p>;

  return <TabsComponent />;
}
