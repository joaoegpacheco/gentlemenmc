"use client";
import { useEffect } from "react";
import { useObservable, useValue } from "@legendapp/state/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InputNumber } from "@/components/ui/input-number";
import { Button } from "@/components/ui/button";
import { notification } from "@/lib/notification";
import { supabase } from "@/hooks/use-supabase";

export function CreditManager() {
  const members$ = useObservable<{ user_id: string; user_name: string; user_email?: string }[]>([]);
  const selectedUser$ = useObservable<string>("");
  const amount$ = useObservable<number>(0);

  const members = useValue(members$);
  const selectedUser = useValue(selectedUser$);
  const amount = useValue(amount$);

  useEffect(() => {
    async function fetchMembers() {
      const { data, error } = await supabase.from("membros").select("user_id, user_name, user_email").order("user_name", { ascending: true });
      if (error) {
        notification.error({ message: "Erro ao carregar membros" });
      }
      members$.set(data || []);
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
      
      amount$.set(0);
      selectedUser$.set("");
    } catch (error: any) {
      notification.error({ 
        message: "Erro ao processar crédito", 
        description: error.message 
      });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Select value={selectedUser || ""} onValueChange={selectedUser$.set}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecione um membro" />
        </SelectTrigger>
        <SelectContent>
          {members.map((m) => (
            <SelectItem key={m.user_id} value={m.user_id}>
              {m.user_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex gap-3">
        <InputNumber
          placeholder="Valor (R$)"
          value={amount}
          onChange={(val) => amount$.set(val ?? 0)}
          min={0}
          step={0.01}
          className="w-full"
        />
        <Button onClick={handleAddCredit}>
          Adicionar Crédito
        </Button>
      </div>
    </div>
  );
}
