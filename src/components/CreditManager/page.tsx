"use client";
import { useEffect, useState } from "react";
import { Select, InputNumber, Button, notification } from "antd";
import { supabase } from "@/hooks/use-supabase";

export function CreditManager() {
  const [members, setMembers] = useState<{ user_id: string; user_name: string; user_email?: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);

  useEffect(() => {
    async function fetchMembers() {
      const { data, error } = await supabase.from("membros").select("user_id, user_name, user_email").order("user_name", { ascending: true });
      if (error) {
        notification.error({ message: "Erro ao carregar membros" });
      }
      setMembers(data || []);
    }
    fetchMembers();
  }, []);

  const handleAddCredit = async () => {
    if (!selectedUser || amount <= 0) {
      notification.error({ message: "Selecione um usuário e valor válido" });
      return;
    }

    const { data, error } = await supabase
      .from("credits")
      .insert([
        {
          user_id: selectedUser,
          balance: amount,
        },
      ]);

    if (error) {
      notification.error({ 
        message: "Erro ao adicionar crédito", 
        description: error.message 
      });
    } else {
      const { data: allCredits } = await supabase
        .from("credits")
        .select("balance")
        .eq("user_id", selectedUser);
      
      const balance = allCredits?.reduce((sum, c) => sum + (c.balance || 0), 0) || 0;
      
      notification.success({ 
        message: `Crédito adicionado com sucesso!`,
        description: `Novo saldo: ${balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
      });
      setAmount(0);
      setSelectedUser("");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Select
        style={{ width: "100%" }}
        placeholder="Selecione um membro"
        options={members.map((m) => ({ value: m.user_id, label: m.user_name }))}
        onChange={(value) => setSelectedUser(value)}
        value={selectedUser || undefined}
      />
      <div style={{ display: "flex", gap: 12 }}>
        <InputNumber
          placeholder="Valor (R$)"
          value={amount}
          onChange={(val) => setAmount(Number(val) || 0)}
          min={0}
          step={0.01}
          precision={2}
          style={{ width: "100%" }}
          formatter={(value) => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
          parser={(value) => Number(value?.replace(/R\$\s?|(\.*)/g, '')) || 0}
        />
        <Button type="primary" onClick={handleAddCredit}>
          Adicionar Crédito
        </Button>
      </div>
    </div>
  );
}
