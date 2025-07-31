"use client";
import React from "react";
import { Form, Input, Button, notification } from "antd";
import { supabase } from "@/hooks/use-supabase";
import { useRouter } from "next/navigation";
import Image from 'next/image';
interface LoginFormValues {
  email: string;
  password: string;
}

export const LoginForm: React.FC = () => {
  const router = useRouter();

  const handleSubmit = async ({ email, password }: LoginFormValues) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      notification.error({
        message: "Erro ao fazer login",
        description: error.message,
      });
      console.error("Erro ao fazer login:", error.message);
      return;
    }

    // Pegar o token da sessão
    const session = await supabase.auth.getSession();
    const authToken = session.data.session?.access_token;
    const userEmail = session.data.session?.user.email;

    if (authToken) {
      // Se for o usuário especial, usar cookie sem expiração
      if (userEmail === "barmc@gentlemenmc.com.br") {
        document.cookie = `authToken=${authToken}; path=/; Secure; SameSite=Lax`;
      } else {
        // Para outros usuários, cookie com expiração padrão de 1 dia
        document.cookie = `authToken=${authToken}; path=/; max-age=86400; Secure; SameSite=Lax`;
      }
      // Redirecionar para a página privada
      router.push("/comandas");
    } else {
      notification.error({
        message: "Erro ao recuperar token",
        description: "Não foi possível recuperar o token de autenticação.",
      });
    }
  };

  return (
    <section style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10, width: "100%" }}>
      <Image
        src="/images/gentlemenmc.png"
        alt="Logo Gentlemen MC"
        width={200}
        height={200}
        style={{
          objectFit: "contain", // Garante que a imagem não distorça
        }}
      />                  
      <Form style={{ width: "100%", padding: 20 }} onFinish={handleSubmit}>
        <Form.Item
          label="Email"
          name="email"
          rules={[{ required: true, message: "Por favor, insira seu email!" }]}
        >
          <Input type="email" />
        </Form.Item>
        <Form.Item
          label="Senha"
          name="password"
          rules={[{ required: true, message: "Por favor, insira sua senha!" }]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item>
          <Button style={{ width: "100%" }} type="primary" htmlType="submit">
            Entrar
          </Button>
        </Form.Item>
      </Form>
      <span style={{ fontSize: 12, color: "#888" }}>Para acesso ao sistema, entre em contato com o administrador</span>
    </section>
  );
};
