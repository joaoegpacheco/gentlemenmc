"use client";
import React, { useEffect, useState, useCallback } from "react";
import type { FormProps } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { Button, Calendar, Form, Select, notification, theme } from "antd";
import supabase from "@/hooks/use-supabase.js";

dayjs.extend(utc);
dayjs.extend(timezone);

type FieldType = {
  date?: string;
  name?: string;
};

type Member = {
  user_id: string;
  user_name: string;
};

export function FormMonthlyFee() {
  const { token } = theme.useToken();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [keyUser, setKeyUser] = useState<string>("");
  const [date, setDate] = useState<string>(dayjs().tz("UTC").format("YYYY-MM-DDTHH:mm:ss.SSSZ"));
  const [members, setMembers] = useState<Member[]>([]);

  const fetchMembers = useCallback(async () => {
    const { data: membros, error } = await supabase
      .from("membros")
      .select("user_id, user_name")
      .order("user_name", { ascending: true });

    if (!error && membros) {
      setMembers(membros);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleUserChange = (value: string) => {
    setKeyUser(value);
  };

  const handlePanelChange = (value: Dayjs) => {
    setDate(value.tz("UTC").format("YYYY-MM-DDTHH:mm:ss.SSSZ"));
  };

  const onFinish: FormProps<FieldType>["onFinish"] = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("bebidas")
        .update({ paid: true })
        .eq("name", keyUser)
        .lte("created_at", date);

      if (error) throw error;
      notification.success({
        message: `A conta do ${keyUser} foi paga com sucesso!`,
      });
    } catch (error: any) {
      notification.error({
        message: `Erro ao tentar pagar a conta: ${error.message}`,
      });
      console.error("Error trying to change paid status:", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      name="updatePaid"
      form={form}
      style={{ width: "100%", paddingTop: 20 }}
      onFinish={onFinish}
      autoComplete="off"
    >
      <Form.Item<FieldType>
        name="name"
        label="Nome"
        rules={[{ required: true, message: "Selecione ao menos um nome!" }]}
      >
        <Select onChange={handleUserChange} defaultValue="" size="large">
          {members.map(({ user_id, user_name }) => (
            <Select.Option key={user_id} value={user_name}>
              {user_name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item<FieldType> name="date" label="Data Limite">
        <div
          style={{
            width: "100%",
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: token.borderRadiusLG,
          }}
        >
          <Calendar fullscreen={false} onChange={handlePanelChange} value={dayjs(date)} />
        </div>
      </Form.Item>

      <Button style={{ width: "100%" }} loading={loading} type="primary" htmlType="submit">
        Atualizar
      </Button>
    </Form>
  );
}
