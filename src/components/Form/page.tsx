"use client";
import React, { useEffect, useState, useMemo } from "react";
import type { FormProps } from "antd";
import { Button, Form, Select, notification } from "antd";
import { formatarDataHora } from "@/utils/formatarDataHora.js";
import supabase from "@/hooks/use-supabase.js";

type FieldType = {
  nome?: string;
  bebida?: string;
  quantidade?: number;
  uuid?: any;
};

type MemberType = {
  user_id: string;
  user_name: string;
};


const BEBIDAS_PRECOS: Record<string, number> = {
  // "Chopp Pilsen": 10,
  // "Chopp Mutum": 15,
  // "Carteira de Cigarro": 14,
  "Long Neck Stella Artois": 8,
  // "Long Neck Stella Artois - Pure Gold": 12,
  "Long Neck Heineken/Corona": 12,
  "Refrigerante": 6,
  "Água": 5,
  "Energético": 15,
  "Vinho Intis": 65,
  "Vinho Finca las Moras": 80,
  "Dose Gin": 15,
  "Dose Jagermeister": 15,
  "Dose Whiskey": 20,
  "Dose Vodka": 15,
  // "Dose Cachaça": 10,
  "Dose Campari": 10,
  // "Caipirinha Vodka Limão": 20,
  // "Caipirinha Cachaça Limão": 15,
};

export function FormComand() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [keyUser, setKeyUser] = useState("");
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
  
      console.log("Membros recebidos da API:", membros);
  
      if (membros) {
        const membrosMap = membros.reduce((acc, membro) => {
          if (membro.user_id) {
            acc[membro.user_id] = membro;
          }
          return acc;
        }, {} as Record<string, MemberType>);
  
        setMembers(membrosMap);
        console.log("Membros mapeados:", membrosMap)
      }
    }
    fetchMembers();
  }, []);

  const handleChange = (_: any, values: any) => setKeyUser(values?.key);

  const handleSubmit: FormProps<FieldType>["onFinish"] = async (values) => {
    setLoading(true);

    if (values.nome === "Romanel") {
      notification.error({ message: "Houve algum erro na hora de cadastrar sua bebida." });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const quantidade = values.quantidade || 1;
      const valorBebida = BEBIDAS_PRECOS[values.bebida || ""] || 0;

      await supabase.from("bebidas").insert([
        {
          name: values.nome,
          drink: values.bebida,
          quantity: quantidade,
          price: valorBebida * quantidade,
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
          <Select.Option key={index} value={member.user_id}>
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
      <Form.Item<FieldType> name="bebida" label="Bebidas" rules={[{ required: true, message: "Selecione ao menos um item!" }]}> 
        <Select size="large" placeholder="Selecione uma bebida">
          {Object.keys(BEBIDAS_PRECOS).map(bebida => (
            <Select.Option key={bebida} value={bebida}>{bebida}</Select.Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item<FieldType> name="quantidade" label="Quantidade"> 
        <Select defaultValue={1} size="large">{optionsQuantidade}</Select>
      </Form.Item>
      <Button style={{ width: "100%" }} loading={loading} type="primary" htmlType="submit">Adicionar</Button>
      {/* @ts-ignore */}
      <Form.Item<FieldType> name="data" initialValue={new Date().toDateString()}> 
        Data e hora agora: <strong>{formatarDataHora(new Date())}</strong>
      </Form.Item>
    </Form>
  );
}
