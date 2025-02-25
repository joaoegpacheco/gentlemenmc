"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { notification } from "antd";
import TabsComponent from "@/components/Tabs/page";

export default function Comandas() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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
      setIsAuthenticated(true);
    }
  }, [router]);

  if (!isAuthenticated) return <p>Carregando...</p>;

  return <TabsComponent />;
}
