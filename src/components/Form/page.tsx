"use client";
import { useEffect } from "react";
import { useTranslations } from 'next-intl';
import { useObservable, useValue } from "@legendapp/state/react";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { notification } from "@/lib/notification";
import { useMediaQuery } from "react-responsive";
import { formatDateTime } from "@/utils/formatDateTime.js";
import { supabase } from "@/hooks/use-supabase.js";
import { consumirEstoque, getEstoqueByDrink } from "@/services/estoqueService";
import { drinksPricesMembers, drinksByCategory } from "@/constants/drinks";
import { message } from "@/lib/message";

// Schema será criado dentro do componente para ter acesso às traduções

type MemberType = {
  user_id: string;
  user_name: string;
  status?: "ativo" | "inativo" | "suspenso";
};

export function FormCommand() {
  const t = useTranslations('form');
  const tCategories = useTranslations('categories');
  const tPlaceholders = useTranslations('placeholders');
  const tEstoqueService = useTranslations('estoqueService');
  
  const formCommandSchema = z.object({
    name: z.string().min(1, t('selectMember')),
    drink: z.string().min(1, t('selectItem')),
    amount: z.number().min(1).default(1),
  });
  
  const form = useForm<z.infer<typeof formCommandSchema>>({
    resolver: zodResolver(formCommandSchema) as any,
    defaultValues: {
      name: "",
      drink: "",
      amount: 1,
    },
  });

  const userId$ = useObservable("");
  const userName$ = useObservable("");
  const selectedDrink$ = useObservable("");
  const selectedCategory$ = useObservable<string>("");
  const members$ = useObservable<Record<string, MemberType>>({});
  const userCredit$ = useObservable<number>(0);
  const drinkStock$ = useObservable<Record<string, number>>({});
  const memberStatus$ = useObservable<"ativo" | "inativo" | "suspenso" | null>(null);

  const userId = useValue(userId$);
  const userName = useValue(userName$);
  const selectedDrink = useValue(selectedDrink$);
  const selectedCategory = useValue(selectedCategory$);
  const members = useValue(members$);
  const userCredit = useValue(userCredit$);
  const drinkStock = useValue(drinkStock$);
  const memberStatus = useValue(memberStatus$);

  // Mapeamento de categorias para nomes amigáveis
  const categoryLabels: Record<string, string> = {
    cervejas: tCategories('beers'),
    cervejasPremium: tCategories('premiumBeers'),
    refrigerantes: tCategories('softDrinks'),
    bebidasNaoAlcoolicas: tCategories('nonAlcoholic'),
    energetico: tCategories('energy'),
    doses: tCategories('shots'),
    vinhos: tCategories('wines'),
    snacks: tCategories('snacks'),
    cigarros: tCategories('cigars'),
  };

  // Obter lista de categorias
  const categories = Object.keys(drinksByCategory);

  // Obter bebidas da categoria selecionada
  const getDrinksForCategory = (category: string): Record<string, number> => {
    if (!category || !drinksByCategory[category as keyof typeof drinksByCategory]) return {};
    return drinksByCategory[category as keyof typeof drinksByCategory].members;
  };

  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

  // Definir primeira categoria como padrão no desktop
  useEffect(() => {
    if (!isMobile && !selectedCategory && categories.length > 0) {
      selectedCategory$.set(categories[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, categories.length]);

  useEffect(() => {
    async function fetchMembers() {
      const { data: membersData, error } = await supabase
        .from("membros")
        .select("user_id, user_name, status")
        .order("user_name", { ascending: true });

      if (error) return message.error(`${t('errorFetchingMembers')}: ${error.message}`);

      const membersMap = (membersData || []).reduce((acc, member) => {
        if (member.user_id) {
          acc[member.user_id] = {
            user_id: member.user_id,
            user_name: member.user_name,
            status: member.status || "ativo"
          };
        }
        return acc;
      }, {} as Record<string, MemberType>);

      members$.set(membersMap);
    }

    async function fetchAllStock() {
      const stockMap: Record<string, number> = {};
      for (const drink of Object.keys(drinksPricesMembers)) {
        const quantity = await getEstoqueByDrink(drink);
        stockMap[drink] = quantity;
      }
      drinkStock$.set(stockMap);
    }

    fetchMembers();
    fetchAllStock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUserCredit = async (user_id: string) => {
    const { data, error } = await supabase
      .from("credits")
      .select("balance")
      .eq("user_id", user_id);
    
    if (!error && data) {
      const balance = data.reduce((sum, c) => sum + (c.balance || 0), 0);
      userCredit$.set(balance);
    } else {
      userCredit$.set(0);
    }
  };

  function calculateCustomPrice(userName: string, drink: string, standardPrice: number): number {
    return standardPrice;
  }

  const handleSubmit = async (values: z.infer<typeof formCommandSchema>) => {
    if (!userId || !userName) {
      notification.error({ message: t('selectValidUserAndDrink') });
      return;
    }

    // Verificar se o membro está suspenso
    if (memberStatus === "suspenso") {
      notification.error({ 
        message: t('memberSuspended'),
        description: t('memberSuspendedMessage', { name: userName })
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const amount = values.amount || 1;
      const valueDrink = calculateCustomPrice(userName, values.drink || "", drinksPricesMembers[values.drink || ""] || 0);

      await consumirEstoque(values.drink!, amount, {
        invalidDrinkOrQuantity: tEstoqueService('errors.invalidDrinkOrQuantity'),
        insufficientStock: tEstoqueService('errors.insufficientStock', { drink: values.drink! }),
      });

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
            notification.error({ message: t('errorRegisteringDrink'), description: drinkError.message });
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
            notification.error({ message: t('errorDebitingCredit'), description: creditError.message });
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
            notification.error({ message: t('errorRegisteringDrink'), description: drinkError.message });
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
            notification.error({ message: t('errorDebitingCredit'), description: creditError.message });
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
          notification.error({ message: t('errorRegisteringDrink'), description: drinkError.message });
          return;
        }
      }

      notification.success({ message: t('drinkAddedSuccessfully') });
      form.reset();
      selectedDrink$.set("");
      selectedCategory$.set("");
      userName$.set("");
      userId$.set("");
      userCredit$.set(0);
      memberStatus$.set(null);
      
      // Atualiza o estoque após consumo
      if (values.drink) {
        const newStock = await getEstoqueByDrink(values.drink);
        drinkStock$.set({ ...drinkStock, [values.drink]: newStock });
      }
    } catch (err) {
      notification.error({ message: t('errorRegisteringDrinkCheckStock') });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="w-full pt-5 space-y-4 min-h-screen" style={{ zoom: "90%" }}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('name')}</FormLabel>
              {Object.keys(members).length > 0 ? (
                isMobile ? (
                  <Select
                    value={userId}
                    onValueChange={(value) => {
                      const member = Object.values(members).find(m => m.user_id === value);
                      if (member) {
                        userId$.set(member.user_id);
                        userName$.set(member.user_name);
                        memberStatus$.set(member.status || "ativo");
                        field.onChange(member.user_name);
                        fetchUserCredit(member.user_id);
                        
                        // Verificar se o membro está suspenso
                        if (member.status === "suspenso") {
                          notification.error({ 
                            message: t('memberSuspended'),
                            description: t('memberSuspendedMessage', { name: member.user_name })
                          });
                        }
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={tPlaceholders('selectMember')} />
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
                          userId$.set(member.user_id);
                          userName$.set(member.user_name);
                          memberStatus$.set(member.status || "ativo");
                          field.onChange(member.user_name);
                          fetchUserCredit(member.user_id);
                          
                          // Verificar se o membro está suspenso e mostrar alerta
                          if (member.status === "suspenso") {
                            notification.error({ 
                              message: t('memberSuspended'),
                              description: t('memberSuspendedMessage', { name: member.user_name })
                            });
                          }
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
                    <SelectValue placeholder={t('loadingMembers')} />
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
              <FormLabel>{t('item')}</FormLabel>
              {isMobile ? (
                <>
                  <Select
                    value={selectedCategory}
                    onValueChange={(value) => {
                      selectedCategory$.set(value);
                      selectedDrink$.set("");
                      field.onChange("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={tPlaceholders('selectCategory')} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {categoryLabels[category] || category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCategory && (
                    <Select
                      value={selectedDrink}
                      onValueChange={(value) => {
                        selectedDrink$.set(value);
                        field.onChange(value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={tPlaceholders('selectDrink')} />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(getDrinksForCategory(selectedCategory)).map(drink => {
                          const stock = drinkStock[drink] || 0;
                          const hasStock = stock > 0;
                          const categoryDrinks = getDrinksForCategory(selectedCategory);
                          const price = categoryDrinks[drink] || 0;
                          return (
                            <SelectItem 
                              key={drink} 
                              value={drink}
                              disabled={!hasStock}
                              className={!hasStock ? "opacity-50 cursor-not-allowed" : ""}
                            >
                              {drink} - {price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} {hasStock ? t('inStock', { stock }) : t('outOfStock')}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  )}
                </>
              ) : (
                <Tabs 
                  value={selectedCategory || categories[0] || ""} 
                  onValueChange={(value) => {
                    selectedCategory$.set(value);
                    selectedDrink$.set("");
                    field.onChange("");
                  }}
                  className="w-full"
                  defaultValue={categories[0] || ""}
                >
                  <TabsList className="h-16 items-center rounded-lg bg-muted p-1 text-muted-foreground grid w-full grid-cols-3 lg:grid-cols-5">
                    {categories.map(category => (
                      <TabsTrigger key={category} value={category} className="text-xs lg:text-sm">
                        {categoryLabels[category] || category}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {categories.map(category => {
                    const categoryDrinks = getDrinksForCategory(category);
                    return (
                      <TabsContent key={category} value={category}>
                        <div className="flex flex-wrap gap-6">
                          {Object.keys(categoryDrinks).map(drink => {
                            const stock = drinkStock[drink] || 0;
                            const hasStock = stock > 0;
                            const price = categoryDrinks[drink] || 0;
                            return (
                              <div key={drink} className="flex flex-col items-center gap-1">
                                <Button
                                  type="button"
                                  variant={selectedDrink === drink ? "default" : "outline"}
                                  disabled={!hasStock}
                                  onClick={() => {
                                    selectedDrink$.set(drink);
                                    field.onChange(drink);
                                  }}
                                  className={!hasStock ? "opacity-50 cursor-not-allowed" : ""}
                                >
                                  {`${drink} ${price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
                                </Button>
                                <span className={`text-xs font-semibold ${hasStock ? 'text-green-600' : 'text-red-600'}`}>
                                  {t('stockLabel')} {stock}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </TabsContent>
                    );
                  })}
                </Tabs>
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
              <FormLabel>{t('quantity')}</FormLabel>
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

        <Button 
          type="submit" 
          className="w-full" 
          disabled={
            form.formState.isSubmitting || 
            !selectedDrink || 
            !userId || 
            memberStatus === "suspenso" ||
            (selectedDrink !== "" && (drinkStock[selectedDrink] || 0) < (form.watch("amount") || 1))
          }
        >
          {form.formState.isSubmitting ? t('adding') : t('add')}
        </Button>

        {userId && (
          <div className="mt-3">
            {memberStatus === "suspenso" ? (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="text-sm font-semibold text-red-900 dark:text-red-100">
                  ⚠️ {t('memberSuspended')}
                </div>
                <div className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {t('memberSuspendedMessage', { name: userName })}
                </div>
              </div>
            ) : (
              <div>
                {t('currentCredit')} <strong>{userCredit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
              </div>
            )}
          </div>
        )}

        {selectedDrink && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              {t('availableStockOf')} <strong>{selectedDrink}</strong>: 
              <span className={`ml-2 text-lg font-bold ${(drinkStock[selectedDrink] || 0) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {drinkStock[selectedDrink] || 0}
              </span>
            </div>
            {form.watch("amount") > (drinkStock[selectedDrink] || 0) && (
              <div className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">
                ⚠️ {t('stockExceeded', { amount: form.watch("amount") })}
              </div>
            )}
          </div>
        )}

        <div className="text-sm">
          {t('currentDateTime')} <strong suppressHydrationWarning>{formatDateTime(new Date())}</strong>
        </div>
      </form>
    </Form>
  );
}
