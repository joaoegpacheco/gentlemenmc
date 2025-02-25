"use client";
import React from "react";
import { Form, Input, Button, notification } from "antd";
import { supabase } from "@/hooks/use-supabase";

interface LoginFormValues {
  email: string;
  password: string;
}

export const LoginForm: React.FC = () => {
  const handleSubmit = async ({ email, password }: LoginFormValues) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      notification.error({
        message: "Erro ao fazer login",
        description: error.message,
      });
      console.error("Erro ao fazer login:", error.message);
    } else {
      window.location.href = "/comandas";
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
