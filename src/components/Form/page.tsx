"use client";
import React, { useEffect, useState, useMemo } from "react";
import type { FormProps } from "antd";
import { Button, Form, Select, notification } from "antd";
import { useMediaQuery } from "react-responsive";
import { formatDateTime } from "@/utils/formatDateTime.js";
import { supabase } from "@/hooks/use-supabase.js";
import { consumirEstoque } from "@/services/estoqueService";
import { BEBIDAS_PRECOS } from "@/constants/drinks";

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

export function FormComand() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [keyUser, setKeyUser] = useState("");
  const [nameUser, setNameUser] = useState("");
  const [selectedDrink, setSelectedDrink] = useState("");
  const [members, setMembers] = useState<Record<string, MemberType>>({});
  const [userCredit, setUserCredit] = useState<number>(0);

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

  const fetchUserCredit = async (user_id: string) => {
    const { data, error } = await supabase.rpc("get_credit_balance", { p_user_id: user_id });
    if (!error && data != null) {
      setUserCredit(data as number);
    } else {
      setUserCredit(0);
    }
  };

  const handleChange = (_: any, values: any) => {
    setKeyUser(values?.value);
    setNameUser(values?.title);
    if (values?.value) fetchUserCredit(values.value);
  };

  function calculateCustomPrice(userName: string, drink: string, standardPrice: number): number {
    // Aqui você pode customizar preços por usuário
    return standardPrice;
  }

  const handleSubmit: FormProps<FieldType>["onFinish"] = async (values) => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const amount = values.amount || 1;
      const valueDrink = calculateCustomPrice(nameUser, values.drink || "", BEBIDAS_PRECOS[values.drink || ""] || 0);

      if (!values.drink || !keyUser || !nameUser) {
        notification.error({ message: "Selecione usuário e bebida válidos." });
        return;
      }

      await consumirEstoque(values.drink!, amount);

      // Se o usuário tem crédito, chama a RPC, senão, insere com paid = null
      if (userCredit >= valueDrink * amount) {
        const { error } = await supabase.rpc("consume_with_credit", {
          p_user_id: keyUser,
          p_user_name: nameUser,
          p_drink: values.drink,
          p_price: valueDrink,
          p_quantity: amount,
          p_user_email: user?.email,
        });

        if (error) {
          notification.error({ message: "Erro ao cadastrar bebida", description: error.message });
          return;
        }
      } else {
        await supabase.from("bebidas").insert([
          {
            name: nameUser,
            drink: values.drink,
            quantity: amount,
            price: valueDrink * amount,
            user: user?.email,
            uuid: keyUser,
            paid: null,
          },
        ]);
      }

      notification.success({ message: "Bebida adicionada com sucesso!" });
      form.resetFields();
      setSelectedDrink("");
      setNameUser("");
      setKeyUser("");
      setUserCredit(0);
    } catch (err) {
      notification.error({ message: "Houve algum erro na hora de cadastrar sua bebida. Verifique se há estoque!" });
    } finally {
      setLoading(false);
    }
  };

  const optionsQuantidade = useMemo(
    () => Array.from({ length: 20 }, (_, i) => <Select.Option key={i + 1} value={i + 1}>{i + 1}</Select.Option>),
    []
  );

  return (
    <Form name="comanda" form={form} style={{ width: "100%", paddingTop: 20 }} onFinish={handleSubmit} autoComplete="off">
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
            <div style={{ gap: "25px", display: "flex", flexWrap: "wrap" }}>
              {Object.values(members).map((member) => (
                <Button
                  key={member.user_id}
                  type={keyUser === member.user_id ? "primary" : "default"}
                  onClick={() => {
                    setKeyUser(member.user_id);
                    setNameUser(member.user_name);
                    form.setFieldValue("nome", member.user_name);
                    fetchUserCredit(member.user_id);
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
      <Form.Item<FieldType>
        name="drink"
        label="Item"
        rules={[{ required: true, message: "Selecione ao menos um item!" }]}
      >
        {isMobile ? (
          <Select size="large" placeholder="Selecione uma bebida" onChange={(value) => setSelectedDrink(value)}>
            {Object.keys(BEBIDAS_PRECOS).map(drink => (
              <Select.Option key={drink} value={drink}>{drink}</Select.Option>
            ))}
          </Select>
        ) : (
          <div style={{ gap: "25px", display: "flex", flexWrap: "wrap" }}>
            {Object.keys(BEBIDAS_PRECOS).map(drink => (
              <Button
                key={drink}
                type={selectedDrink === drink ? "primary" : "default"}
                onClick={() => {
                  setSelectedDrink(drink);
                  form.setFieldValue("drink", drink);
                }}
              >
                {`${drink} ${BEBIDAS_PRECOS[drink].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
              </Button>
            ))}
          </div>
        )}
      </Form.Item>
      <Form.Item<FieldType> name="amount" label="Quantidade">
        <Select defaultValue={1} size="large">{optionsQuantidade}</Select>
      </Form.Item>
      <Button style={{ width: "100%" }} loading={loading} type="primary" htmlType="submit">
        Adicionar
      </Button>

      {keyUser && (
        <div style={{ marginTop: 12 }}>
          Crédito atual: <strong>{userCredit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
        </div>
      )}

      <Form.Item<FieldType> name="data">
        Data e hora agora: <strong suppressHydrationWarning>{formatDateTime(new Date())}</strong>
      </Form.Item>
    </Form>
  );
}
