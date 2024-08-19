import React, { useState } from "react";
import { Form, Input, Button, notification } from "antd";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://cuqvbjobsgfbfahjrzeq.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1cXZiam9ic2dmYmZhaGpyemVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg5ODgxOTQsImV4cCI6MjAzNDU2NDE5NH0.4TzTzyJZSAnZckDTCEQrVYg6MLmpyHkg1VvI-gipXAU"
);

export const ChangePasswordForm = () => {
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (values: any) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.newPassword,
      });

      if (error) throw error;
      notification.success({ message: "Sua senha foi alterada com sucesso!" });
      window.location.href = "/comandas";
    } catch (error: any) {
      notification.error({
        message: `Erro ao tentar trocar sua senha: ${error.message}`,
      });
      console.error("Error changing password:", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onFinish={handleChangePassword}>
      <Form.Item
        label="Nova Senha"
        name="newPassword"
        rules={[{ required: true, message: "Por favor, insira a nova senha!" }]}
      >
        <Input.Password />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          Alterar Senha
        </Button>
      </Form.Item>
    </Form>
  );
};
