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
  name?: string;
  drink?: string;
  amount?: number;
  uuid?: any;
  date?: string;
};

type MemberType = {
  user_id: string;
  user_name: string;
};

export function FormCommand() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [selectedDrink, setSelectedDrink] = useState("");
  const [members, setMembers] = useState<Record<string, MemberType>>({});
  const [userCredit, setUserCredit] = useState<number>(0);

  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

  useEffect(() => {
    async function fetchMembers() {
      const { data: membersData, error } = await supabase
        .from("membros")
        .select("user_id, user_name")
        .order("user_name", { ascending: true });

      if (error) return console.error("Erro ao buscar membros:", error);

      const membersMap = (membersData || []).reduce((acc, member) => {
        if (member.user_id) acc[member.user_id] = member;
        return acc;
      }, {} as Record<string, MemberType>);

      setMembers(membersMap);
    }

    fetchMembers();
  }, []);

  const fetchUserCredit = async (user_id: string) => {
    const { data, error } = await supabase
      .from("credits")
      .select("balance")
      .eq("user_id", user_id);
    
    if (!error && data) {
      const balance = data.reduce((sum, c) => sum + (c.balance || 0), 0);
      setUserCredit(balance);
    } else {
      setUserCredit(0);
    }
  };

  const handleChange = (_: any, values: any) => {
    setUserId(values?.value);
    setUserName(values?.title);
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
      const valueDrink = calculateCustomPrice(userName, values.drink || "", BEBIDAS_PRECOS[values.drink || ""] || 0);

      if (!values.drink || !userId || !userName) {
        notification.error({ message: "Selecione usuário e bebida válidos." });
        return;
      }

      await consumirEstoque(values.drink!, amount);

      const totalPrice = valueDrink * amount;
      
      // Se o usuário tem crédito, usar para abater
      if (userCredit > 0) {
        if (userCredit >= totalPrice) {
          // Crédito suficiente - marca como paga e debita todo o valor
          const { error: drinkError } = await supabase.from("bebidas").insert([
            {
              name: userName,
              drink: values.drink,
              quantity: amount,
              price: totalPrice,
              user: user?.email,
              uuid: userId,
              paid: true,
            },
          ]);

          if (drinkError) {
            notification.error({ message: "Erro ao cadastrar bebida", description: drinkError.message });
            return;
          }

          // Debita do crédito inserindo valor negativo
          const { error: creditError } = await supabase.from("credits").insert([
            {
              user_id: userId,
              balance: -totalPrice,
            },
          ]);

          if (creditError) {
            notification.error({ message: "Erro ao debitar crédito", description: creditError.message });
            return;
          }
        } else {
          // Crédito insuficiente - abate parcialmente
          const remainingPrice = totalPrice - userCredit;
          
          // Insere a bebida com o valor restante (após abater crédito) e marca como não paga
          const { error: drinkError } = await supabase.from("bebidas").insert([
            {
              name: userName,
              drink: values.drink,
              quantity: amount,
              price: remainingPrice, // Apenas o valor que falta pagar
              user: user?.email,
              uuid: userId,
              paid: null,
            },
          ]);

          if (drinkError) {
            notification.error({ message: "Erro ao cadastrar bebida", description: drinkError.message });
            return;
          }

          // Debita todo o crédito disponível
          const { error: creditError } = await supabase.from("credits").insert([
            {
              user_id: userId,
              balance: -userCredit, // Debita todo o crédito disponível
            },
          ]);

          if (creditError) {
            notification.error({ message: "Erro ao debitar crédito", description: creditError.message });
            return;
          }
        }
      } else {
        // Sem crédito - insere normalmente como não paga
        const { error: drinkError } = await supabase.from("bebidas").insert([
          {
            name: userName,
            drink: values.drink,
            quantity: amount,
            price: totalPrice,
            user: user?.email,
            uuid: userId,
            paid: null,
          },
        ]);

        if (drinkError) {
          notification.error({ message: "Erro ao cadastrar bebida", description: drinkError.message });
          return;
        }
      }

      notification.success({ message: "Bebida adicionada com sucesso!" });
      form.resetFields();
      setSelectedDrink("");
      setUserName("");
      setUserId("");
      setUserCredit(0);
    } catch (err) {
      notification.error({ message: "Houve algum erro na hora de cadastrar sua bebida. Verifique se há estoque!" });
    } finally {
      setLoading(false);
    }
  };

  const quantityOptions = useMemo(
    () => Array.from({ length: 20 }, (_, i) => <Select.Option key={i + 1} value={i + 1}>{i + 1}</Select.Option>),
    []
  );

  return (
    <Form name="command" form={form} style={{ width: "100%", paddingTop: 20 }} onFinish={handleSubmit} autoComplete="off">
      <Form.Item<FieldType>
        name="name"
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
                  type={userId === member.user_id ? "primary" : "default"}
                  onClick={() => {
                    setUserId(member.user_id);
                    setUserName(member.user_name);
                    form.setFieldValue("name", member.user_name);
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
        <Select defaultValue={1} size="large">{quantityOptions}</Select>
      </Form.Item>
      <Button style={{ width: "100%" }} loading={loading} type="primary" htmlType="submit">
        Adicionar
      </Button>

      {userId && (
        <div style={{ marginTop: 12 }}>
          Crédito atual: <strong>{userCredit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
        </div>
      )}

      <Form.Item<FieldType> name="date">
        Data e hora agora: <strong suppressHydrationWarning>{formatDateTime(new Date())}</strong>
      </Form.Item>
    </Form>
  );
}
