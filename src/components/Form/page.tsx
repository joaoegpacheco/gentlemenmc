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
  uuid?: any;
};

const dataAtual = new Date();

export function FormComand() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [keyUser, setKeyUser] = useState("");

  const onChange = (options: any, values: any) => {
    setKeyUser(values?.key);
  };

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    setLoading(true);
    let valorBebida = 0;
    switch (values.bebida) {
      case "Long Neck":
        valorBebida = 10;
        break;
      // case "Cerveja Lata":
      //   valorBebida = 8;
      //   break;
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
      case "Vinho La Linda":
        valorBebida = 65;
        break;
      case "Vinho Intis":
        valorBebida = 65;
        break;
      case "Vinho Finca las Moras":
        valorBebida = 80;
        break;
      // case "Vinho Luigi Bosca":
      //   valorBebida = 90;
      //   break;
      case "Heineken 1L Lata":
        valorBebida = 20;
        break;
      case "Dose Jagermeister":
        valorBebida = 15;
        break;
      case "Dose Jack Daniels":
        valorBebida = 20;
        break;
      // case "Dose Vodka Smirnoff":
      //   valorBebida = 15;
      //   break;
      // case "Dose Vodka Absolut":
      //   valorBebida = 20;
      //   break;
      // case "Dose Cachaça":
      //   valorBebida = 10;
      //   break;
      // case "Caipirinha Vodka Limão":
      //   valorBebida = 20;
      //   break;
      // case "Caipirinha Cachaça Limão":
      //   valorBebida = 15;
      //   break;
      default:
        valorBebida = 0;
    }
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

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
          <Select.Option
            key="1f135b00-383f-40cf-9540-48c06bc5c855"
            value="Alex"
          >
            Alex
          </Select.Option>
          <Select.Option
            key="77c5b5a4-d280-462f-93c7-14fca108e20e"
            value="André"
          >
            André
          </Select.Option>
          <Select.Option
            key="33dc3a2b-479c-4536-a1d7-58925cbe620c"
            value="Athayde"
          >
            Athayde
          </Select.Option>
          <Select.Option
            key="0919d6ae-f60c-4770-a00b-80c320014bcc"
            value="Bacelar"
          >
            Bacelar
          </Select.Option>
          <Select.Option
            key="9f31aeb7-3136-4968-8b74-8dc99fcf17d0"
            value="Baeza"
          >
            Baeza
          </Select.Option>
          <Select.Option
            key="e99f4437-3115-498a-85a6-71c920e2a9bc"
            value="Beto"
          >
            Beto
          </Select.Option>
          <Select.Option
            key="cfb348d8-68e9-4891-9ce7-62040784e597"
            value="Cláudio"
          >
            Cláudio
          </Select.Option>
          <Select.Option
            key="f4c33b80-979e-48b9-bb60-cf1c9249c939"
            value="Fernando"
          >
            Fernando
          </Select.Option>
          <Select.Option
            key="e5c6b48d-bb42-4cf9-bf92-cc14fa424282"
            value="Giuliano"
          >
            Giuliano
          </Select.Option>
          <Select.Option
            key="09939f59-1567-4253-a1bd-fc1f627cdc19"
            value="Gulitich"
          >
            Gulitich
          </Select.Option>
          <Select.Option
            key="6a7443c3-bfa5-444a-81b6-dcc36ecf47dd"
            value="Índio"
          >
            Índio
          </Select.Option>
          <Select.Option
            key="9d498ee1-bd55-4c57-be1f-73735b170b8a"
            value="Jeferson"
          >
            Jeferson
          </Select.Option>
          <Select.Option
            key="7804fbe9-a032-43d3-b791-34ccb6b99fcc"
            value="João Marius"
          >
            João Marius
          </Select.Option>
          <Select.Option
            key="8e70a015-e115-43ed-ac26-f9be4e4fa795"
            value="Madalosso"
          >
            Madalosso
          </Select.Option>
          <Select.Option
            key="478aa74d-6492-49f2-bfdc-fc75e7ac7da2"
            value="Maicon"
          >
            Maicon
          </Select.Option>
          <Select.Option
            key="a21965e8-f88c-4f7a-b6ff-3394225581cf"
            value="Mega"
          >
            Mega
          </Select.Option>
          <Select.Option
            key="94bb7a82-46c4-40d4-ac82-e17e467f5d2b"
            value="Mortari"
          >
            Mortari
          </Select.Option>
          <Select.Option
            key="39f0b35a-1465-4c27-9f07-e2c5c997d278"
            value="Pacheco"
          >
            Pacheco
          </Select.Option>
          <Select.Option
            key="d75fd637-c930-4f66-a9be-ce68676f5c10"
            value="Rafael"
          >
            Rafael
          </Select.Option>
          <Select.Option
            key="3f52fd2c-1dfe-4969-8f99-f6ce935a4045"
            value="Rodrigo N.D"
          >
            Rodrigo N.D
          </Select.Option>
          <Select.Option
            key="472c2d35-f0c3-4aee-8da7-89b1f29a271e"
            value="Rodrigo"
          >
            Rodrigo
          </Select.Option>
          <Select.Option
            key="6df6d3ca-36ba-4137-b0e4-09bf61f022b0"
            value="Rogério"
          >
            Rogério
          </Select.Option>
          <Select.Option
            key="1c03f226-6d76-4e7e-9c42-5ba0910f4977"
            value="Weriton"
          >
            Weriton
          </Select.Option>
          <Select.Option
            key="712301d0-f118-4650-b982-35a353103e9d"
            value="Zanona"
          >
            Zanona
          </Select.Option>
          <Select.Option
            key="3407168d-90f3-41af-b183-5d84ef292355"
            value="Zeca"
          >
            Zeca
          </Select.Option>
          <Select.Option
            key="1b8684af-f7bd-4ecb-8fb1-35b8893880ab"
            value="Zé Carlos"
          >
            Zé Carlos
          </Select.Option>
          <Select.Option
            key="06050bc6-be74-45fc-8c10-bab22b24ee21"
            value="Zorek"
          >
            Zorek
          </Select.Option>
          <Select.Option
            key="ab99f83f-af0d-4462-a92f-51787ae9c945"
            value="Robson"
          >
            Robson
          </Select.Option>
          <Select.Option
            key="d3de25e3-8a52-4d05-9c8d-fc87788c01aa"
            value="Romanel"
          >
            Romanel
          </Select.Option>
          <Select.Option
            key="a21ad418-5aaa-40ba-a8f4-9b92e1121635"
            value="Vinicius"
          >
            Vinicius
          </Select.Option>
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
          <Select.Option value="Vinho Intis">Vinho Intis</Select.Option>
          <Select.Option value="Vinho Vinho Finca las Moras">Vinho Vinho Finca las Moras</Select.Option>
          {/* <Select.Option value="Vinho Cordero">Vinho Cordero</Select.Option>
          <Select.Option value="Vinho Luigi Bosca">
            Vinho Luigi Bosca
          </Select.Option> */}
          <Select.Option value="Heineken 1L Lata">
            Heineken 1L Lata
          </Select.Option>
          <Select.Option value="Dose Jagermeister">
            Dose Jagermeister
          </Select.Option>
          <Select.Option value="Dose Jack Daniels">
            Dose Jack Daniels
          </Select.Option>
          <Select.Option value="Dose Vodka Smirnoff">
            Dose Vodka Smirnoff
          </Select.Option>
          {/* <Select.Option value="Dose Vodka Absolut">
            Dose Vodka Absolut
          </Select.Option>
          <Select.Option value="Dose Cachaça">Dose Cachaça</Select.Option>
          <Select.Option value="Caipirinha Vodka Limão">
            Caipirinha Vodka Limão
          </Select.Option>
          <Select.Option value="Caipirinha Cachaça Limão">
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
        label="Data Atual"
        initialValue={dataAtual.toDateString()}
      >
        {dataAtual.toDateString()}
      </Form.Item>
    </Form>
  );
}
