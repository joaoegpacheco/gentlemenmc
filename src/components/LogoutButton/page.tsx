import React from "react";
import { Button, notification } from "antd";
import supabase from "@/hooks/use-supabase";

export const LogoutButton: React.FC = () => {
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      notification.success({
        message: "Logout realizado com sucesso!",
      });

      window.location.href = "/";
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      notification.error({
        message: "Falha ao fazer logout",
        description: (error as Error).message || "Tente novamente.",
      });
    }
  };

  return (
    <Button type="text" onClick={handleLogout}>
      Sair
    </Button>
  );
};
