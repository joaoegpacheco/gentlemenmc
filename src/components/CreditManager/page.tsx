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

    try {
      // Buscar o nome do usuário para verificar dívidas
      const { data: memberData } = await supabase
        .from("membros")
        .select("user_name")
        .eq("user_id", selectedUser)
        .single();

      if (!memberData) {
        notification.error({ message: "Usuário não encontrado" });
        return;
      }

      // Buscar todas as bebidas do usuário
      const { data: allDrinks, error: drinksError } = await supabase
        .from("bebidas")
        .select("id, price, created_at, paid")
        .eq("uuid", selectedUser)
        .order("created_at", { ascending: true }); // Mais antigas primeiro

      if (drinksError) {
        notification.error({ 
          message: "Erro ao verificar dívidas", 
          description: drinksError.message 
        });
        return;
      }

      // Filtrar apenas bebidas não pagas (dívidas ativas)
      const unpaidDrinks = allDrinks?.filter(drink => {
        const isPaid = drink.paid === null || drink.paid === false || drink.paid === 0;
        return isPaid;
      }) || [];

      // Calcular total da dívida
      const totalDebt = unpaidDrinks.reduce((sum, drink) => sum + (Number(drink.price) || 0), 0);
      
      let remainingCredit = amount;
      let debtPaid = 0;

      // Se houver dívida e crédito para abater
      if (totalDebt > 0 && remainingCredit > 0) {
        if (remainingCredit >= totalDebt) {
          // Crédito suficiente para pagar toda a dívida
          const drinkIds = unpaidDrinks.map(d => d.id);
          
          const { error: updateError } = await supabase
            .from("bebidas")
            .update({ paid: true })
            .in("id", drinkIds);

          if (updateError) {
            notification.error({ 
              message: "Erro ao atualizar dívidas", 
              description: updateError.message 
            });
            return;
          }

          debtPaid = totalDebt;
          remainingCredit = remainingCredit - totalDebt;
        } else {
          // Crédito insuficiente - abater parcialmente
          let creditToApply = remainingCredit;
          
          for (const drink of unpaidDrinks) {
            const drinkPrice = Number(drink.price) || 0;
            
            if (creditToApply >= drinkPrice) {
              // Pode pagar esta bebida completamente
              const { error: updateError } = await supabase
                .from("bebidas")
                .update({ paid: true })
                .eq("id", drink.id);

              if (updateError) {
                notification.error({ 
                  message: "Erro ao atualizar dívida", 
                  description: updateError.message 
                });
                return;
              }

              creditToApply -= drinkPrice;
              debtPaid += drinkPrice;
            } else {
              // Não há crédito suficiente para pagar mais bebidas
              break;
            }
          }
          
          remainingCredit = 0; // Todo o crédito foi usado para abater dívidas
        }
      }

      // Se ainda sobrar crédito após abater dívidas, adicionar à tabela credits
      if (remainingCredit > 0) {
        const { error: creditError } = await supabase
          .from("credits")
          .insert([
            {
              user_id: selectedUser,
              balance: remainingCredit,
            },
          ]);

        if (creditError) {
          notification.error({ 
            message: "Erro ao adicionar crédito", 
            description: creditError.message 
          });
          return;
        }
      }

      // Calcular saldo final
      const { data: allCredits } = await supabase
        .from("credits")
        .select("balance")
        .eq("user_id", selectedUser);
      
      const balance = allCredits?.reduce((sum, c) => sum + (c.balance || 0), 0) || 0;

      // Mensagem de sucesso informando o que foi feito
      let successMessage = "";
      let description = `Novo saldo: ${balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
      
      if (debtPaid > 0 && remainingCredit > 0) {
        successMessage = "Crédito adicionado e dívida abatida!";
        description = `Dívida abatida: ${debtPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} | Crédito restante adicionado: ${remainingCredit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} | Novo saldo: ${balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
      } else if (debtPaid > 0 && remainingCredit === 0) {
        successMessage = "Dívida abatida com sucesso!";
        description = `Dívida abatida: ${debtPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} | Novo saldo: ${balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
      } else {
        successMessage = "Crédito adicionado com sucesso!";
      }

      notification.success({ 
        message: successMessage,
        description: description
      });
      
      setAmount(0);
      setSelectedUser("");
    } catch (error: any) {
      notification.error({ 
        message: "Erro ao processar crédito", 
        description: error.message 
      });
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
