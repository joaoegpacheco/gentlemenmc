"use client";
import React, { useEffect, useState } from "react";
import type { FormProps } from "antd";
import { Button, Form, Select, notification } from "antd";
import supabase from "@/hooks/use-supabase.js";

type FieldType = {
  month?: any;
  uuid?: any;
};

const dataAtual = new Date();

export function FormMonthlyFee() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [keyUser, setKeyUser] = useState("");
  const [members, setMembers] = useState([])

  const onChange = (options: any, values: any) => {
    setKeyUser(values?.key);
  };

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    setLoading(true);
    try {

    const { data, error } = await supabase
    .from('mansalidades')
    .insert([
      {
        paid: true,
        month: values.month,
        //@ts-ignore
        uuid: keyUser,
      },
    ])
    .select()
        
      if (data) {notification.success({ message: "Mensalidade adicionada com sucesso!" })}
      if (error) {notification.error({ message: "Erro ao adicionar mensalidade!" })}
    } catch {
      notification.error({
        message: "Houve algum erro na hora de cadastrar mensalidade.",
      });
      setLoading(false);
    } finally {
      form.resetFields();
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

  return (
    <Form
      name="mensalidade"
      form={form}
      style={{ width: "100%", paddingTop: 20 }}
      onFinish={onFinish}
      autoComplete="off"
      clearOnDestroy
    >
      <Form.Item<FieldType>
        name="uuid"
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
        name="month"
        label="Mês"
        rules={[{ required: true, message: "Selecione ao menos um mês!" }]}
      >
        <Select defaultValue={""} size="large">
          <Select.Option value="Janeiro">Janeiro</Select.Option>
          <Select.Option value="Fevereiro">Fevereiro</Select.Option>
          <Select.Option value="Março">Março</Select.Option>
          <Select.Option value="Abril">Abril</Select.Option>
          <Select.Option value="Maio">Maio</Select.Option>
          <Select.Option value="Junho">Junho</Select.Option>
          <Select.Option value="Julho">Julho</Select.Option>
          <Select.Option value="Agosto">Agosto</Select.Option>
          <Select.Option value="Setembro">Setembro</Select.Option>
          <Select.Option value="Outubro">Outubro</Select.Option>
          <Select.Option value="Novembro">Novembro</Select.Option>
          <Select.Option value="Dezembro">Dezembro</Select.Option>
        </Select>
      </Form.Item>
      <Button
        style={{ width: "100%" }}
        loading={loading}
        type="primary"
        htmlType="submit"
      >
        Adicionar
      </Button>
    </Form>
  );
}
