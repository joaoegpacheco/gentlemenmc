"use client";
import React, { useState } from "react";
import type { FormProps } from "antd";
import { Button, Form, Select, notification } from "antd";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://cuqvbjobsgfbfahjrzeq.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1cXZiam9ic2dmYmZhaGpyemVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg5ODgxOTQsImV4cCI6MjAzNDU2NDE5NH0.4TzTzyJZSAnZckDTCEQrVYg6MLmpyHkg1VvI-gipXAU"
);

type FieldType = {
  nome?: string;
  bebida?: string;
  quantidade?: number;
  data?: any;
};

const dataAtual = new Date();

export function FormComand() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    setLoading(true);
    let valorBebida = 0;
    switch (values.bebida) {
      case "Long Neck":
        valorBebida = 10;
        break;
      case "Refrigerante":
        valorBebida = 6;
        break;
      case "Água":
        valorBebida = 5;
        break;
      case "Energético":
        valorBebida = 12;
        break;
      case "Vinho Cordero":
        valorBebida = 40;
        break;
      case "Vinho Luigi Bosca":
        valorBebida = 80;
        break;
      case "Heineken 1L Lata":
        valorBebida = 20;
        break;
      case "Dose Jagermeister":
        valorBebida = 15;
        break;
      case "Dose Jack Daniels":
        valorBebida = 20;
        break;
      default:
        valorBebida = 0;
    }
    try {
      await supabase.from("bebidas").insert([
        {
          name: values.nome,
          drink: values.bebida,
          quantity: values.quantidade ? values.quantidade : 1,
          price: valorBebida * (values.quantidade ? values.quantidade : 1),
        },
      ]);
      notification.success({ message: "Bebida adicionada com sucesso!" });
    } catch {
      notification.error({
        message: "Houve algum erro na hora de cadastrar sua bebida.",
      });
      setLoading(false);
    } finally {
      form.resetFields();
      setLoading(false);
    }
  };

  let options = [];
  for (let i = 1; i <= 20; i++) {
    options.push(
      <Select.Option key={i} value={i}>
        {i}
      </Select.Option>
    );
  }

  return (
    <Form
      name="comanda"
      form={form}
      style={{ width: 768, padding: 50 }}
      onFinish={onFinish}
      autoComplete="off"
      clearOnDestroy
    >
      <Form.Item<FieldType>
        name="nome"
        label="Nome"
        rules={[{ required: true, message: "Selecione ao menos um nome!" }]}
      >
        <Select defaultValue={""} size="large">
          <Select.Option value="Alex">Alex</Select.Option>
          <Select.Option value="André">André</Select.Option>
          <Select.Option value="Athayde">Athayde</Select.Option>
          <Select.Option value="Bacelar">Bacelar</Select.Option>
          <Select.Option value="Baeza">Baeza</Select.Option>
          <Select.Option value="Beto">Beto</Select.Option>
          <Select.Option value="Cláudio">Cláudio</Select.Option>
          <Select.Option value="Fernando">Fernando</Select.Option>
          <Select.Option value="Giuliano">Giuliano</Select.Option>
          <Select.Option value="Gulitich">Gulitich</Select.Option>
          <Select.Option value="Índio">Índio</Select.Option>
          <Select.Option value="Jeferson">Jeferson</Select.Option>
          <Select.Option value="João Marius">João Marius</Select.Option>
          <Select.Option value="Madalosso">Madalosso</Select.Option>
          <Select.Option value="Maicon">Maicon</Select.Option>
          <Select.Option value="Mega">Mega</Select.Option>
          <Select.Option value="Mortari">Mortari</Select.Option>
          <Select.Option value="Pacheco">Pacheco</Select.Option>
          <Select.Option value="Rafael">Rafael</Select.Option>
          <Select.Option value="Rodrigo N.D">Rodrigo N.D</Select.Option>
          <Select.Option value="Rodrigo">Rodrigo</Select.Option>
          <Select.Option value="Rogério">Rogério</Select.Option>
          <Select.Option value="Weriton">Weriton</Select.Option>
          <Select.Option value="Zanona">Zanona</Select.Option>
          <Select.Option value="Zeca">Zeca</Select.Option>
          <Select.Option value="Zé Carlos">Zé Carlos</Select.Option>
          <Select.Option value="Zorek">Zorek</Select.Option>
          <Select.Option value="Robson">Robson</Select.Option>
          <Select.Option value="Romanel">Romanel</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item<FieldType>
        name="bebida"
        label="Bebidas"
        rules={[{ required: true, message: "Selecione ao menos um item!" }]}
      >
        <Select defaultValue={""} size="large">
          <Select.Option value="Long Neck">Long Neck</Select.Option>
          <Select.Option value="Refrigerante">Refrigerante</Select.Option>
          <Select.Option value="Água">Água</Select.Option>
          <Select.Option value="Energético">Energético</Select.Option>
          <Select.Option value="Vinho Cordero">Vinho Cordero</Select.Option>
          <Select.Option value="Vinho Luigi Bosca">
            Vinho Luigi Bosca
          </Select.Option>
          <Select.Option value="Heineken 1L Lata">
            Heineken 1L Lata
          </Select.Option>
          <Select.Option value="Dose Jagermeister">
            Dose Jagermeister
          </Select.Option>
          <Select.Option value="Dose Jack Daniels">
            Dose Jack Daniels
          </Select.Option>
        </Select>
      </Form.Item>
      <Form.Item<FieldType> name="quantidade" label="Quantidade">
        <Select defaultValue={1} size="large">
          {options}
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
      <Form.Item<FieldType>
        name="data"
        label="Data Atual"
        initialValue={dataAtual.toDateString()}
      >
        {dataAtual.toDateString()}
      </Form.Item>
    </Form>
  );
}
