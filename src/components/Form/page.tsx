"use client";
import { useEffect, useState } from "react";
import { useTranslations } from 'next-intl';
import { useObservable, useValue } from "@legendapp/state/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { notification } from "@/lib/notification";
import { Trash2 } from "lucide-react";
import { useMediaQuery } from "react-responsive";
import { formatDateTime } from "@/utils/formatDateTime.js";
import { supabase } from "@/hooks/use-supabase.js";
import { consumirEstoque, getAllStock } from "@/services/estoqueService";
import { message } from "@/lib/message";
import { useDrinks } from "@/hooks/useDrinks";
import { printComandaHTML } from "@/utils-client/printComandaHTML";
import { appStore$ } from "@/stores/appStore";

const BAR_MC_EMAIL = "barmc@gentlemenmc.com.br";

// Schema será criado dentro do componente para ter acesso às traduções

type MemberType = {
  user_id: string;
  user_name: string;
  status?: "ativo" | "inativo" | "suspenso";
};

type CartItem = {
  drink: string;
  quantity: number;
  price: number;
};

export function FormCommand() {
  const { drinksPricesMembers, drinksByCategory } = useDrinks();
  const t = useTranslations('form');
  const tCategories = useTranslations('categories');
  const tPlaceholders = useTranslations('placeholders');
  const tEstoqueService = useTranslations('estoqueService');
  
  const formCommandSchema = z.object({
    name: z.string().min(1, t('selectMember')),
  });
  
  const form = useForm<z.infer<typeof formCommandSchema>>({
    resolver: zodResolver(formCommandSchema) as any,
    defaultValues: {
      name: "",
    },
  });

  const userId$ = useObservable("");
  const userName$ = useObservable("");
  const items$ = useObservable<CartItem[]>([]);
  const selectedCategory$ = useObservable<string>("");
  const members$ = useObservable<Record<string, MemberType>>({});
  const userCredit$ = useObservable<number>(0);
  const drinkStock$ = useObservable<Record<string, number>>({});
  const memberStatus$ = useObservable<"ativo" | "inativo" | "suspenso" | null>(null);
  const openHouse$ = appStore$.switches.openHouse;

  const userId = useValue(userId$);
  const userName = useValue(userName$);
  const items = useValue(items$);
  const selectedCategory = useValue(selectedCategory$);
  const members = useValue(members$);
  const userCredit = useValue(userCredit$);
  const drinkStock = useValue(drinkStock$);
  const memberStatus = useValue(memberStatus$);
  const openHouse = useValue(appStore$.switches.openHouse);
  const [isBarMcUser, setIsBarMcUser] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelled) return;
      const isBar = user?.email === BAR_MC_EMAIL;
      setIsBarMcUser(isBar);
      if (!isBar) openHouse$.set(false);
    });
    return () => {
      cancelled = true;
    };
    // openHouse$ is a stable Legend observable; only read session once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mapeamento de categorias para nomes amigáveis
  const categoryLabels: Record<string, string> = {
    cervejas: tCategories('beers'),
    comidas: tCategories('comidas'),
    // cervejasPremium: tCategories('premiumBeers'),
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
      const stockMap = await getAllStock();
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

  /** Igual à nova comanda: carrinho persiste ao trocar categoria; repetir clique na mesma bebida incrementa qtd. */
  const bumpDrinkToCart = (drink: string, linePrice: number) => {
    const price = linePrice || drinksPricesMembers[drink] || 0;
    const stock = drinkStock[drink] || 0;
    if (!stock || !price) return;

    items$.set((old) => {
      const existing = old.find((i) => i.drink === drink);
      const qty = existing?.quantity ?? 0;
      if (qty >= stock) {
        message.warning(t("stockExceeded", { amount: qty + 1 }));
        return old;
      }
      if (existing) {
        return old.map((i) =>
          i.drink === drink ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...old, { drink, quantity: 1, price }];
    });
  };

  const removeCartLine = (drink: string) => {
    items$.set((old) => old.filter((i) => i.drink !== drink));
  };

  const handleSubmit = async (_values: z.infer<typeof formCommandSchema>) => {
    const cart = items$.peek() as CartItem[];
    const shouldPrintOpenHouse = openHouse$.peek();
    const cartForPrint = cart.map((i) => ({
      drink: i.drink,
      quantity: i.quantity,
      price: i.price,
    }));

    if (!userId || !userName) {
      notification.error({ message: t('selectValidUserAndDrink') });
      return;
    }

    if (!cart?.length) {
      notification.error({ message: t('selectItem') });
      return;
    }

    if (memberStatus === "suspenso") {
      notification.error({ 
        message: t('memberSuspended'),
        description: t('memberSuspendedMessage', { name: userName })
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      let creditLeft = userCredit;

      for (const item of cart) {
        const amount = item.quantity;
        const valueDrink = calculateCustomPrice(
          userName,
          item.drink,
          drinksPricesMembers[item.drink] ?? item.price
        );
        const totalPrice = valueDrink * amount;

        await consumirEstoque(item.drink, amount, {
          invalidDrinkOrQuantity: tEstoqueService('errors.invalidDrinkOrQuantity'),
          insufficientStock: tEstoqueService('errors.insufficientStock', { drink: item.drink }),
        });

        if (creditLeft > 0) {
          if (creditLeft >= totalPrice) {
            const { error: drinkError } = await supabase.from("bebidas").insert([
              {
                name: userName,
                drink: item.drink,
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

            const { error: creditError } = await supabase.from("credits").insert([
              { user_id: userId, balance: -totalPrice },
            ]);

            if (creditError) {
              notification.error({ message: t('errorDebitingCredit'), description: creditError.message });
              return;
            }
            creditLeft -= totalPrice;
          } else {
            const remainingPrice = totalPrice - creditLeft;

            const { error: drinkError } = await supabase.from("bebidas").insert([
              {
                name: userName,
                drink: item.drink,
                quantity: amount,
                price: remainingPrice,
                user: user?.email,
                uuid: userId,
                paid: null,
              },
            ]);

            if (drinkError) {
              notification.error({ message: t('errorRegisteringDrink'), description: drinkError.message });
              return;
            }

            const { error: creditError } = await supabase.from("credits").insert([
              { user_id: userId, balance: -creditLeft },
            ]);

            if (creditError) {
              notification.error({ message: t('errorDebitingCredit'), description: creditError.message });
              return;
            }
            creditLeft = 0;
          }
        } else {
          const { error: drinkError } = await supabase.from("bebidas").insert([
            {
              name: userName,
              drink: item.drink,
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
      }

      notification.success({ message: t('drinkAddedSuccessfully') });
      if (
        shouldPrintOpenHouse &&
        user?.email === BAR_MC_EMAIL &&
        typeof window !== "undefined"
      ) {
        const payload = { guestName: userName, items: cartForPrint };
        window.setTimeout(() => {
          void printComandaHTML(payload);
        }, 0);
      }
      items$.set([]);
      userId$.set("");
      userName$.set("");
      memberStatus$.set(null);
      userCredit$.set(0);
      form.reset({ name: "" });
      const stockMap = await getAllStock();
      drinkStock$.set(stockMap);
    } catch (err) {
      notification.error({ message: t('errorRegisteringDrinkCheckStock') });
    }
  };

  const cartTotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

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
                    value={userId || undefined}
                    onValueChange={(value) => {
                      const member = Object.values(members).find(m => m.user_id === value);
                      if (member) {
                        userId$.set(member.user_id);
                        userName$.set(member.user_name);
                        memberStatus$.set(member.status || "ativo");
                        field.onChange(member.user_name);
                        items$.set([]);
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
                          items$.set([]);
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

        <div className="space-y-2">
          <Label>{t('item')}</Label>
          {isMobile ? (
            <>
              <Select
                value={selectedCategory}
                onValueChange={(value) => selectedCategory$.set(value)}
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2">
                  {Object.keys(getDrinksForCategory(selectedCategory)).map((drink) => {
                    const stock = drinkStock[drink] || 0;
                    const hasStock = stock > 0;
                    const categoryDrinks = getDrinksForCategory(selectedCategory);
                    const price = categoryDrinks[drink] || 0;
                    const qtyInCart = items.find((i) => i.drink === drink)?.quantity ?? 0;
                    const atMaxQty = qtyInCart >= stock;
                    return (
                      <div key={drink} className="flex flex-col items-center gap-1">
                        <Button
                          type="button"
                          variant={qtyInCart > 0 ? "default" : "outline"}
                          disabled={!hasStock || atMaxQty}
                          className={!hasStock ? "opacity-50 cursor-not-allowed min-h-[4rem] whitespace-pre-wrap flex flex-col" : "min-h-[4rem] whitespace-pre-wrap flex flex-col"}
                          onClick={() => bumpDrinkToCart(drink, price)}
                        >
                          <span className="text-center leading-tight text-xs sm:text-sm">{drink}</span>
                          <span className="text-xs font-normal">
                            {price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </span>
                        </Button>
                        <span className={`text-xs font-semibold ${hasStock ? "text-green-600" : "text-red-600"}`}>
                          {t("stockLabel")} {stock}
                        </span>
                        {qtyInCart > 0 && (
                          <span className="text-xs text-blue-600 font-medium">
                            {t("inCart", { quantity: qtyInCart })}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <Tabs
              value={selectedCategory || categories[0] || ""}
              onValueChange={(value) => selectedCategory$.set(value)}
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
                        const qtyInCart = items.find((i) => i.drink === drink)?.quantity ?? 0;
                        const atMaxQty = qtyInCart >= stock;
                        return (
                          <div key={drink} className="flex flex-col items-center gap-1">
                            <Button
                              type="button"
                              variant={qtyInCart > 0 ? "default" : "outline"}
                              disabled={!hasStock || atMaxQty}
                              onClick={() => bumpDrinkToCart(drink, price)}
                              className={!hasStock ? "opacity-50 cursor-not-allowed" : ""}
                            >
                              {`${drink} ${price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
                            </Button>
                            <span className={`text-xs font-semibold ${hasStock ? 'text-green-600' : 'text-red-600'}`}>
                              {t('stockLabel')} {stock}
                            </span>
                            {qtyInCart > 0 && (
                              <span className="text-xs text-blue-600 font-medium">
                                {t('inCart', { quantity: qtyInCart })}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          )}
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('item')}</TableHead>
                <TableHead>{t('quantity')}</TableHead>
                <TableHead>{t('subtotal')}</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    {t('cartNoItems')}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, idx) => (
                  <TableRow key={`${item.drink}-${idx}`}>
                    <TableCell>{item.drink}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>R$ {(item.price * item.quantity).toFixed(2)}</TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeCartLine(item.drink)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="text-lg font-bold">
          {t('orderTotal')}: R$ {cartTotal.toFixed(2)}
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={
            form.formState.isSubmitting ||
            items.length === 0 ||
            !userId ||
            memberStatus === "suspenso"
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
        {isBarMcUser ? (
          <div className="flex items-center gap-2 shrink-0">
            <Switch
              id="open-house-switch"
              size="sm"
              checked={openHouse}
              onCheckedChange={(checked) => openHouse$.set(checked)}
              className="shrink-0 border border-border/80 data-[state=unchecked]:bg-muted-foreground/25"
            />
            <Label htmlFor="open-house-switch" className="text-xs font-semibold cursor-pointer leading-snug text-foreground">
              {t("openHouse")}
            </Label>
          </div>
        ) : null}
        <div className="text-sm">
          {t('currentDateTime')} <strong suppressHydrationWarning>{formatDateTime(new Date())}</strong>
        </div>
      </form>
    </Form>
  );
}
