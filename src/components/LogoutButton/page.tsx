import React from "react";
import { Button, notification } from "antd";
import supabase from "@/hooks/use-supabase.js";

export const LogoutButton = () => {
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Erro ao fazer logout:", error.message);
      notification.error({
        message: `Falha ao fazer logout.`,
      });
    } else {
      notification.success({ message: "Logout realizado com sucesso!" });
      // Redirecione o usuário para a página inicial ou qualquer outra página após o logout
      window.location.href = "/";
    }
  };

  return (
    <Button type="text" onClick={handleLogout}>
      Sair
    </Button>
  );
};
