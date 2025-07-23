"use client";
import React, { useEffect, useState, useMemo } from "react";
import type { FormProps } from "antd";
import { Button, Form, Select, notification } from "antd";
import { formatDateTime } from "@/utils/formatDateTime.js";
import { supabase } from "@/hooks/use-supabase.js";

type FieldType = {
  nome?: string;
  drink?: string;
  amount?: number;
  uuid?: any;
  data?: string;
};

type MemberType = {
  user_id: string;
  user_name: string;
};


const BEBIDAS_PRECOS: Record<string, number> = {
  // "Festa Soares dia 21": 20,
  "Chopp Pilsen": 12,
  "Chopp Mutum": 20,
  "Long Neck Heineken/Corona": 12,
  "Quentão": 10,
  //"Original Lata": 8,
  "Heineken Lata": 10,
"Energético": 15,
  // "Long Neck Stella Artois": 8,
  // "Long Neck Stella Artois - Pure Gold": 12,
  "Refrigerante": 6,
  // "Refrigerante Garrafinha": 4,
  "Água": 5,
  // "Energético": 15,
  // "Vinho Cordero": 45,
  // "Vinho Finca las Moras": 80,
  "Dose Gin": 6,
  "Dose Jagermeister": 18,
  "Dose Whiskey": 15,
  // "Dose Vodka": 15,
  // "Dose Cachaça": 10,
  "Dose Campari": 15,
  //"Cachorro-Quente": 12,
  //"Carne Louca": 12,
  //"Pipoca": 5,
  //"Pinhão": 8,
  "Carteira de Cigarro": 15,
  // "Caipirinha Vodka Limão": 20,
  // "Caipirinha Cachaça Limão": 15,
};

export function FormComand() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [keyUser, setKeyUser] = useState("");
  const [nameUser, setNameUser] = useState("");
  const [members, setMembers] = useState<Record<string, MemberType>>({});

  useEffect(() => {
    async function fetchMembers() {
      const { data: membros, error } = await supabase
        .from("membros")
        .select("user_id, user_name")
        .order("user_name", { ascending: true });
  
      if (error) {
        console.error("Erro ao buscar membros:", error);
        return;
      }

      if (!membros || membros.length === 0) {
        console.warn("Nenhum membro encontrado.");
        return;
      }
    
      if (membros) {
        const membersMap = membros.reduce((acc, membro) => {
          if (membro.user_id) {
            acc[membro.user_id] = membro;
          }
          return acc;
        }, {} as Record<string, MemberType>);
  
        setMembers(membersMap);
      }
    }
    fetchMembers();
  }, []);

  const handleChange = (_: any, values: any) => {
    setKeyUser(values?.value)
    setNameUser(values?.title)
  };

  function calculateCustomPrice(userName: string, drink: string, standardPrice: number): number {
    // if (userName === "Robson" && drink === "Chopp Pilsen") {
    //   return 8;
    // }
    return standardPrice;
  }

  const handleSubmit: FormProps<FieldType>["onFinish"] = async (values) => {
    setLoading(true);

    if (values.nome === "Romanel") {
      notification.error({ message: "Houve algum erro na hora de cadastrar sua bebida." });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const amount = values.amount || 1;
      // const valorBebida = BEBIDAS_PRECOS[values.bebida || ""] || 0;

      let valueDrink = calculateCustomPrice(nameUser, values.drink || "", BEBIDAS_PRECOS[values.drink || ""] || 0);

      await supabase.from("bebidas").insert([
        {
          name: nameUser,
          drink: values.drink,
          quantity: amount,
          price: valueDrink * amount,
          user: user?.email,
          uuid: keyUser,
        },
      ]);
      notification.success({ message: "Bebida adicionada com sucesso!" });
      form.resetFields();
    } catch {
      notification.error({ message: "Houve algum erro na hora de cadastrar sua bebida." });
    } finally {
      setLoading(false);
    }
  };

  const optionsQuantidade = useMemo(() => 
    Array.from({ length: 20 }, (_, i) => (
      <Select.Option key={i + 1} value={i + 1}>{i + 1}</Select.Option>
    )), []
  );

  return (
    <Form name="comanda" form={form} style={{ width: "100%", paddingTop: 20 }} onFinish={handleSubmit} autoComplete="off">
      <Form.Item<FieldType> 
        name="nome" 
        label="Nome" 
        rules={[{ required: true, message: "Selecione ao menos um nome!" }]}
      > 
      {Object.keys(members).length > 0 ? ( // Verifica se há membros carregados
        <Select onChange={handleChange} size="large" placeholder="Selecione um membro">
        {Object.values(members).map((member, index) => (
          <Select.Option key={index} value={member.user_id} title={member.user_name}>
            {member.user_name}
          </Select.Option>
        ))}
      </Select>
      ) : (
        <Select
          disabled
          options={[{ value: 'Carregando membros...', label: 'Carregando membros...' }]}
        />
      )}
      </Form.Item>
      <Form.Item<FieldType> name="drink" label="Item" rules={[{ required: true, message: "Selecione ao menos um item!" }]}> 
        <Select size="large" placeholder="Selecione uma bebida">
          {Object.keys(BEBIDAS_PRECOS).map(drink => (
            <Select.Option key={drink} value={drink}>{drink}</Select.Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item<FieldType> name="amount" label="Quantidade"> 
        <Select defaultValue={1} size="large">{optionsQuantidade}</Select>
      </Form.Item>
      <Button style={{ width: "100%" }} loading={loading} type="primary" htmlType="submit">Adicionar</Button>
      <Form.Item<FieldType> name="data">
        Data e hora agora: <strong suppressHydrationWarning>{formatDateTime(new Date())}</strong>
      </Form.Item>
    </Form>
  );
}
