"use client";
import React, { useEffect, useState } from "react";
import { Form, Input, Button, notification } from "antd";
import { supabase } from "@/hooks/use-supabase";
import { useRouter } from "next/navigation";
import Image from 'next/image';

interface LoginFormValues {
  email: string;
  password: string;
}

export const LoginForm: React.FC = () => {
  const [loading, setLoading] = useState(true); // Adiciona um estado de carregamento
  const router = useRouter();

  // Verifica se o usuário está logado
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push("/protected/comandas"); // Redireciona para a página protegida
      } else {
        setLoading(false); // Só exibe o formulário se não houver usuário
      }
    };

    checkUser();
  }, [router]);

  // Não renderiza o formulário enquanto verifica a autenticação
  if (loading) {
    return <div>Loading...</div>;
  }

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
      router.push("/protected/comandas");
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
