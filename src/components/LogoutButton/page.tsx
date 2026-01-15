import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { Button, ButtonProps } from "@/components/ui/button";
import { notification } from "@/lib/notification";
import { supabase } from "@/hooks/use-supabase";
import { useTranslations } from 'next-intl';

export const LogoutButton: React.FC<ButtonProps> = ({ asChild, variant, size, className, ...props }) => {
  const t = useTranslations('logout');
  const tCommon = useTranslations('common');
  
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Remover o cookie authToken
      document.cookie = "authToken=; path=/; max-age=0;";

      notification.success({
        message: t('logoutSuccess'),
      });

      // Redirecionar para a página inicial
      window.location.href = "/";
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      notification.error({
        message: t('logoutFailed'),
        description: (error as Error).message || t('tryAgain'),
      });
    }
  };

  if (asChild) {
    return (
      <Slot onClick={handleLogout} {...props}>
        {tCommon('logout')}
      </Slot>
    );
  }

  return (
    <Button variant={variant || "ghost"} size={size} className={className} onClick={handleLogout} {...props}>
      {tCommon('logout')}
    </Button>
  );
};
