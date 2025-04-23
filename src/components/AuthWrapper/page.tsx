"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/hooks/use-supabase";
import TabsComponent from "@/components/Tabs/page";
import { LoginForm } from "@/components/LoginForm/page";

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user); // Se houver um usuário, está autenticado
    };

    checkAuth();
  }, []);

  // Se a verificação de autenticação ainda estiver em andamento, exibe "Carregando..."
  if (isAuthenticated === null) {
    return <div>Carregando...</div>;
  }

  // Se o usuário não estiver autenticado, exibe o formulário de login
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Se estiver autenticado, exibe a navegação (TabsComponent) e o conteúdo
  return (
    <>
      <TabsComponent />
      {children}
    </>
  );
}
