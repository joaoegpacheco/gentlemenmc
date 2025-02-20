"use client";
import React, { useEffect, useState } from "react";
import type { FormProps } from "antd";
import type { Dayjs } from 'dayjs';
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { Button, Calendar, Form, Select, notification, theme } from "antd";
import supabase from "@/hooks/use-supabase.js";

type FieldType = {
  date?: any;
  name?: any;
};

const dataAtual = new Date();

export function FormMonthlyFee() {
  const { token } = theme.useToken();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [keyUser, setKeyUser] = useState("");
  const [date, setDate] = useState("");
  const [members, setMembers] = useState([])

  const onChange = (options: any, values: any) => {
    setKeyUser(options);
  };

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    setLoading(true);
    try {
      
    const { data, error } = await supabase
    .from('bebidas')
    .update({ paid: true })
    .eq('name', keyUser)
    .lte('created_at', date)
    .select()

      if (error) throw error;
      notification.success({ message: `A conta do ${keyUser} foi paga com sucesso!` });
    } catch (error: any) {
      notification.error({
        message: `Erro ao tentar pagar a conta: ${error.message}`,
      });
      console.error("Error trying to changing paid:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {

    const members = async () => {
      let { data: membros } = await supabase.from('membros').select('user_id,user_name').order('user_name', { ascending: true })
      //@ts-ignore
      setMembers(membros)
    }
    members()
        
  },[])

  const wrapperStyle: React.CSSProperties = {
    width: 300,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
  };

  dayjs.extend(utc);
  dayjs.extend(timezone);

  const onPanelChange = (value: Dayjs) => {
    const formattedDate = value.tz("UTC").format("YYYY-MM-DDTHH:mm:ss.SSSZ"); 
    setDate(formattedDate);
  };

  return (
    <Form
      name="updatePaid"
      form={form}
      style={{ width: "100%", paddingTop: 20 }}
      onFinish={onFinish}
      autoComplete="off"
      clearOnDestroy
    >
      <Form.Item<FieldType>
        name="name"
        label="Nome"
        rules={[{ required: true, message: "Selecione ao menos um nome!" }]}
      >
        <Select onChange={onChange} defaultValue={""} size="large">
          {members.map(member => (
            <Select.Option
            //@ts-ignore
            key={member?.user_id}
            //@ts-ignore
            value={member?.user_name}
          >
            {//@ts-ignore
            member?.user_name}
          </Select.Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item<FieldType>
        name="date"
        label="Data Limite"
      >
        <div style={wrapperStyle}>
          <Calendar fullscreen={false} onChange={onPanelChange} />
        </div>
      </Form.Item>
      <Button
        style={{ width: "100%" }}
        loading={loading}
        type="primary"
        htmlType="submit"
      >
        Atualizar
      </Button>
    </Form>
  );
}
