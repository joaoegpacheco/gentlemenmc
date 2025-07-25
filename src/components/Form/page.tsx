"use client";
import React, { useEffect, useState, useMemo } from "react";
import type { FormProps } from "antd";
import { Button, Form, Select, notification } from "antd";
import { useMediaQuery } from "react-responsive";
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
  "Chopp Pilsen": 12,
  "Chopp Mutum": 20,
  "Long Neck Heineken/Corona": 12,
  "Quentão": 10,
  "Heineken Lata": 10,
  "Energético": 15,
  "Refrigerante": 6,
  "Água": 5,
  "Dose Gin": 15,
  "Dose Jagermeister": 20,
  "Dose Whiskey": 25,
  "Dose Campari": 15,
  "Carteira de Cigarro": 15,
};

export function FormComand() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [keyUser, setKeyUser] = useState("");
  const [nameUser, setNameUser] = useState("");
  const [selectedDrink, setSelectedDrink] = useState("");
  const [members, setMembers] = useState<Record<string, MemberType>>({});

  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

  useEffect(() => {
    async function fetchMembers() {
      const { data: membros, error } = await supabase
        .from("membros")
        .select("user_id, user_name")
        .order("user_name", { ascending: true });

      if (error) return console.error("Erro ao buscar membros:", error);

      const membersMap = (membros || []).reduce((acc, membro) => {
        if (membro.user_id) acc[membro.user_id] = membro;
        return acc;
      }, {} as Record<string, MemberType>);

      setMembers(membersMap);
    }

    fetchMembers();
  }, []);

  const handleChange = (_: any, values: any) => {
    setKeyUser(values?.value);
    setNameUser(values?.title);
  };

  function calculateCustomPrice(userName: string, drink: string, standardPrice: number): number {
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
      const valueDrink = calculateCustomPrice(nameUser, values.drink || "", BEBIDAS_PRECOS[values.drink || ""] || 0);

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
      setSelectedDrink("");
      setNameUser("");
      setKeyUser("");
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
      
      {/* NOME (MEMBROS) */}
      <Form.Item<FieldType>
        name="nome"
        label="Nome"
        rules={[{ required: true, message: "Selecione ao menos um nome!" }]}
      >
        {Object.keys(members).length > 0 ? (
          isMobile ? (
            <Select onChange={handleChange} size="large" placeholder="Selecione um membro">
              {Object.values(members).map((member) => (
                <Select.Option key={member.user_id} value={member.user_id} title={member.user_name}>
                  {member.user_name}
                </Select.Option>
              ))}
            </Select>
          ) : (
            <div style={{gap: "25px", display: "flex", flexWrap: "wrap"}} className="flex flex-wrap gap-2">
              {Object.values(members).map((member) => (
                <Button
                  key={member.user_id}
                  type={keyUser === member.user_id ? "primary" : "default"}
                  onClick={() => {
                    setKeyUser(member.user_id);
                    setNameUser(member.user_name);
                    form.setFieldValue("nome", member.user_name);
                  }}
                >
                  {member.user_name}
                </Button>
              ))}
            </div>
          )
        ) : (
          <Select disabled options={[{ value: 'Carregando membros...', label: 'Carregando membros...' }]} />
        )}
      </Form.Item>

      {/* ITEM (DRINKS) */}
      <Form.Item<FieldType>
        name="drink"
        label="Item"
        rules={[{ required: true, message: "Selecione ao menos um item!" }]}
      >
        {isMobile ? (
          <Select
            size="large"
            placeholder="Selecione uma bebida"
            onChange={(value) => {
              setSelectedDrink(value);
            }}
          >
            {Object.keys(BEBIDAS_PRECOS).map(drink => (
              <Select.Option key={drink} value={drink}>
                {drink}
              </Select.Option>
            ))}
          </Select>
        ) : (
          <div style={{gap: "25px", display: "flex", flexWrap: "wrap"}} className="flex flex-wrap gap-2">
            {Object.keys(BEBIDAS_PRECOS).map(drink => (
              <Button
                key={drink}
                type={selectedDrink === drink ? "primary" : "default"}
                onClick={() => {
                  setSelectedDrink(drink);
                  form.setFieldValue("drink", drink);
                }}
              >
                {drink}
              </Button>
            ))}
          </div>
        )}
      </Form.Item>

      {/* QUANTIDADE */}
      <Form.Item<FieldType> name="amount" label="Quantidade">
        <Select defaultValue={1} size="large">{optionsQuantidade}</Select>
      </Form.Item>

      {/* BOTÃO SUBMIT */}
      <Button style={{ width: "100%" }} loading={loading} type="primary" htmlType="submit">
        Adicionar
      </Button>

      <Form.Item<FieldType> name="data">
        Data e hora agora: <strong suppressHydrationWarning>{formatDateTime(new Date())}</strong>
      </Form.Item>
    </Form>
  );
}
