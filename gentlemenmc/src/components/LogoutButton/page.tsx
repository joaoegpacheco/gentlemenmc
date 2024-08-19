import React from "react";
import { Button, notification } from "antd";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://cuqvbjobsgfbfahjrzeq.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1cXZiam9ic2dmYmZhaGpyemVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg5ODgxOTQsImV4cCI6MjAzNDU2NDE5NH0.4TzTzyJZSAnZckDTCEQrVYg6MLmpyHkg1VvI-gipXAU"
);

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
