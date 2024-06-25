"use client";
import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Tabs } from 'antd';
import type { TabsProps } from 'antd';
import { FormComand } from "@/components/Form/page";
import { CardComand } from "@/components/Card/page";
import { ChangePasswordForm } from "@/components/ChangePasswordForm/page";
import { LogoutButton } from "@/components/LogoutButton/page";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://cuqvbjobsgfbfahjrzeq.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1cXZiam9ic2dmYmZhaGpyemVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg5ODgxOTQsImV4cCI6MjAzNDU2NDE5NH0.4TzTzyJZSAnZckDTCEQrVYg6MLmpyHkg1VvI-gipXAU"
);

const items: TabsProps['items'] = [
    {
        key: '1',
        label: 'Marcar',
        children: <FormComand />,
      },
      {
        key: '2',
        label: 'Ver marcações',
        children: <CardComand />,
      },
      {
        key: '3',
        label: 'Alterar senha',
        children: <ChangePasswordForm />,
      },
      {
        key: '4',
        label: <LogoutButton />
      }
];

export default function TabsComponent() { 

  useEffect(() => {
    const checkIfUserIsLoggedIn = async () => {
      const session = supabase.auth.getSession();
      const { data: { user } } = await supabase.auth.getUser()

      if (!session || !user) {
        // Se o usuário não estiver logado, redirecione para a página principal
        window.location.href = "/";
      }
    };

    checkIfUserIsLoggedIn();
  }, []);

  return ( 
    <Tabs style={{width: "100%", padding: 20}} defaultActiveKey="1" items={items} />
  )
};