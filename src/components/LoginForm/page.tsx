"use client";
import React, { useState } from "react";
import { Form, Input, Button, notification } from "antd";
import supabase from "@/hooks/use-supabase.js";

export const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      notification.error({
        message: `Erro ao fazer login: ${error.message}`,
      });
      console.error("Erro ao fazer login:", error.message);
    } else {
      // Redirecionar para a página de comandas após login bem-sucedido
      window.location.href = "/comandas";
    }
  };

  return (
    <Form style={{ width: "100%", padding: 20 }} onFinish={handleSubmit}>
      <Form.Item label="Email">
        <Input value={email} onChange={(e) => setEmail(e.target.value)} />
      </Form.Item>
      <Form.Item label="Senha">
        <Input.Password
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Form.Item>
      <Form.Item>
        <Button style={{ width: "100%" }} type="primary" htmlType="submit">
          Entrar
        </Button>
      </Form.Item>
    </Form>
  );
};
