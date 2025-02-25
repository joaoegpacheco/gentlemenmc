"use client";
import React from "react";
import { Form, Input, Button, notification } from "antd";
import { supabase } from "@/hooks/use-supabase";
import { useRouter } from "next/navigation";

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

    if (authToken) {
      // Salvar token nos cookies
      document.cookie = `authToken=${authToken}; path=/; max-age=86400; Secure`;

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
  );
};
