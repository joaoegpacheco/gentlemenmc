"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { notification } from "@/lib/notification";
import { useMediaQuery } from "react-responsive";
import { formatDateTime } from "@/utils/formatDateTime.js";
import { supabase } from "@/hooks/use-supabase.js";
import { consumirEstoque } from "@/services/estoqueService";
import { BEBIDAS_PRECOS } from "@/constants/drinks";

const formCommandSchema = z.object({
  name: z.string().min(1, "Selecione ao menos um nome!"),
  drink: z.string().min(1, "Selecione ao menos um item!"),
  amount: z.number().min(1).default(1),
});

type MemberType = {
  user_id: string;
  user_name: string;
};

export function FormCommand() {
  const form = useForm<z.infer<typeof formCommandSchema>>({
    resolver: zodResolver(formCommandSchema) as any,
    defaultValues: {
      name: "",
      drink: "",
      amount: 1,
    },
  });

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

  function calculateCustomPrice(userName: string, drink: string, standardPrice: number): number {
    return standardPrice;
  }

  const handleSubmit = async (values: z.infer<typeof formCommandSchema>) => {
    if (!userId || !userName) {
      notification.error({ message: "Selecione usuário e bebida válidos." });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const amount = values.amount || 1;
      const valueDrink = calculateCustomPrice(userName, values.drink || "", BEBIDAS_PRECOS[values.drink || ""] || 0);

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
      form.reset();
      setSelectedDrink("");
      setUserName("");
      setUserId("");
      setUserCredit(0);
    } catch (err) {
      notification.error({ message: "Houve algum erro na hora de cadastrar sua bebida. Verifique se há estoque!" });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="w-full pt-5 space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              {Object.keys(members).length > 0 ? (
                isMobile ? (
                  <Select
                    value={userId}
                    onValueChange={(value) => {
                      const member = Object.values(members).find(m => m.user_id === value);
                      if (member) {
                        setUserId(member.user_id);
                        setUserName(member.user_name);
                        field.onChange(member.user_name);
                        fetchUserCredit(member.user_id);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um membro" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(members).map((member) => (
                        <SelectItem key={member.user_id} value={member.user_id}>
                          {member.user_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex flex-wrap gap-6">
                    {Object.values(members).map((member) => (
                      <Button
                        key={member.user_id}
                        type="button"
                        variant={userId === member.user_id ? "default" : "outline"}
                        onClick={() => {
                          setUserId(member.user_id);
                          setUserName(member.user_name);
                          field.onChange(member.user_name);
                          fetchUserCredit(member.user_id);
                        }}
                      >
                        {member.user_name}
                      </Button>
                    ))}
                  </div>
                )
              ) : (
                <Select disabled>
                  <SelectTrigger>
                    <SelectValue placeholder="Carregando membros..." />
                  </SelectTrigger>
                </Select>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="drink"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item</FormLabel>
              {isMobile ? (
                <Select
                  value={selectedDrink}
                  onValueChange={(value) => {
                    setSelectedDrink(value);
                    field.onChange(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma bebida" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(BEBIDAS_PRECOS).map(drink => (
                      <SelectItem key={drink} value={drink}>
                        {drink}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex flex-wrap gap-6">
                  {Object.keys(BEBIDAS_PRECOS).map(drink => (
                    <Button
                      key={drink}
                      type="button"
                      variant={selectedDrink === drink ? "default" : "outline"}
                      onClick={() => {
                        setSelectedDrink(drink);
                        field.onChange(drink);
                      }}
                    >
                      {`${drink} ${BEBIDAS_PRECOS[drink].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
                    </Button>
                  ))}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantidade</FormLabel>
              <FormControl>
                <Select
                  value={field.value?.toString() || "1"}
                  onValueChange={(val) => field.onChange(parseInt(val))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Adicionando..." : "Adicionar"}
        </Button>

        {userId && (
          <div className="mt-3">
            Crédito atual: <strong>{userCredit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
          </div>
        )}

        <div className="text-sm">
          Data e hora agora: <strong suppressHydrationWarning>{formatDateTime(new Date())}</strong>
        </div>
      </form>
    </Form>
  );
}
