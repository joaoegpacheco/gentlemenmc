"use client";
import React, { useEffect, useState } from "react";
import type { FormProps } from "antd";
import { Button, Form, Select, notification } from "antd";
import { formatarDataHora } from "@/utils/formatarDataHora.js";
import supabase from "@/hooks/use-supabase.js";

type FieldType = {
  nome?: string;
  bebida?: string;
  quantidade?: number;
  data?: any;
  uuid?: any;
};

const dataAtual = new Date();

export function FormComand() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [keyUser, setKeyUser] = useState("");
  const [members, setMembers] = useState([])

  const onChange = (options: any, values: any) => {
    setKeyUser(values?.key);
  };

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    setLoading(true);
    let valorBebida = 0;
    switch (values.bebida) {
      case "Chopp Promoção":
        valorBebida = 5;
        break;
      // case "Long Neck Amstel":
      //   valorBebida = 8;
      //   break;
      case "Long Neck Stella Artois":
        valorBebida = 10;
        break;
      case "Long Neck Stella Artois - Pure Gold":
        valorBebida = 12;
        break;
      case "Long Neck Heineken/Corona":
        valorBebida = 12;
        break;
      case "Chopp":
        valorBebida = 10;
      break;
      case "Refrigerante":
        valorBebida = 6;
        break;
      case "Água":
        valorBebida = 5;
        break;
      case "Energético":
        valorBebida = 15;
        break;
      // case "Vinho Cordero":
      //   valorBebida = 55;
      //   break;
      // case "Vinho La Linda":
      //   valorBebida = 65;
      //   break;
      case "Vinho Intis":
        valorBebida = 65;
        break;
      case "Vinho Finca las Moras":
        valorBebida = 80;
        break;
      // case "Vinho Luigi Bosca":
      //   valorBebida = 90;
      //   break;
      // case "Heineken 1L Lata":
      //   valorBebida = 20;
      //   break;
      case "Dose Gin":
        valorBebida = 15;
        break;
      case "Dose Jagermeister":
        valorBebida = 15;
        break;
      case "Dose Jack Daniels":
        valorBebida = 20;
        break;
      case "Dose Vodka Smirnoff":
        valorBebida = 15;
        break;
      // case "Dose Vodka Absolut":
      //   valorBebida = 20;
      //   break;
      case "Dose Cachaça":
        valorBebida = 10;
        break;
      case "Dose Campari":
        valorBebida = 10;
        break;
      case "Caipirinha Vodka Limão":
        valorBebida = 20;
        break;
      case "Caipirinha Cachaça Limão":
        valorBebida = 15;
        break;
      default:
        valorBebida = 0;
    }
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (values.nome === "Romanel") {
        notification.error({
          message: "Houve algum erro na hora de cadastrar sua bebida.",
        });
        return
      }

      await supabase.from("bebidas").insert([
        {
          name: values.nome,
          drink: values.bebida,
          quantity: values.quantidade ? values.quantidade : 1,
          price: valorBebida * (values.quantidade ? values.quantidade : 1),
          //@ts-ignore
          user: user.email,
          uuid: keyUser,
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
      name="comanda"
      form={form}
      style={{ width: "100%", paddingTop: 20 }}
      onFinish={onFinish}
      autoComplete="off"
      clearOnDestroy
    >
      <Form.Item<FieldType>
        name="nome"
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
        name="bebida"
        label="Bebidas"
        rules={[{ required: true, message: "Selecione ao menos um item!" }]}
      >
        <Select defaultValue={""} size="large">
          <Select.Option value="Chopp">Chopp</Select.Option>
          <Select.Option value="Long Neck Stella Artois - Pure Gold">Long Neck Stella Artois - Pure Gold</Select.Option>
          <Select.Option value="Long Neck Stella Artois">Long Neck Stella Artois</Select.Option>
          <Select.Option value="Long Neck Heineken/Corona">Long Neck Heineken</Select.Option>
          {/* <Select.Option value="Chopp Promoção">Chopp Promoção</Select.Option> */}
          <Select.Option value="Refrigerante">Refrigerante</Select.Option>
          <Select.Option value="Água">Água</Select.Option>
          <Select.Option value="Energético">Energético</Select.Option>
          <Select.Option value="Vinho Intis">Vinho Intis</Select.Option>
          <Select.Option value="Vinho Finca las Moras">Vinho Finca las Moras</Select.Option>
          {/* <Select.Option value="Vinho Cordero">Vinho Cordero</Select.Option>
          <Select.Option value="Vinho Luigi Bosca">
            Vinho Luigi Bosca
          </Select.Option> */}
          {/* <Select.Option value="Heineken 1L Lata">
            Heineken 1L Lata
          </Select.Option> */}
          <Select.Option value="Dose Gin">
            Dose Gin
          </Select.Option>
          <Select.Option value="Dose Jagermeister">
            Dose Jagermeister
          </Select.Option>
          <Select.Option value="Dose Jack Daniels">
            Dose Jack Daniels
          </Select.Option>
          {/* <Select.Option value="Dose Vodka Smirnoff">
            Dose Vodka Smirnoff
          </Select.Option> */}
          <Select.Option value="Dose Cachaça">Dose Cachaça</Select.Option>
          <Select.Option value="Dose Campari">Dose Campari</Select.Option>
          {/* <Select.Option value="Caipirinha Vodka Limão">
            Caipirinha Vodka Limão
          </Select.Option> */}
          {/* <Select.Option value="Caipirinha Cachaça Limão">
            Caipirinha Cachaça Limão
          </Select.Option> */}
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
        initialValue={dataAtual.toDateString()}
      >
        Data e hora agora: <strong>{formatarDataHora(dataAtual)}</strong>
      </Form.Item>
    </Form>
  );
}
