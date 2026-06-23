"use client";

import { useEffect, forwardRef, useImperativeHandle } from "react";
import { useTranslations } from 'next-intl';
import { useObservable, useValue } from "@legendapp/state/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { message } from "@/lib/message";
import { Spinner } from "@/components/ui/spinner";
import { Trash2 } from "lucide-react";
import { updateComanda } from "@/services/comandaService";
import { consumirEstoque, devolverEstoque, getAllStock } from "@/services/estoqueService";
import { supabase } from "@/hooks/use-supabase";
import { useDeviceSizes } from "@/utils/mediaQueries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDrinks } from "@/hooks/useDrinks";
import { appStore$ } from "@/stores/appStore";

interface Props { }

interface AdminData {
  email: string;
  id: string;
}

export const OpenComandasPageContent = forwardRef((_: Props, ref) => {
  const { drinksByCategory } = useDrinks();
  const t = useTranslations('openComandas');
  const tComandas = useTranslations('comandas');
  const tNova = useTranslations('novaComanda');
  const tCategories = useTranslations('categories');
  const tEstoqueService = useTranslations('estoqueService');
  const comandas$ = useObservable<any[]>([]);
  const loading$ = useObservable(false);
  const selectedComanda$ = useObservable<any | null>(null);
  const pendingItems$ = useObservable<{ drink: string; quantity: number; price: number }[]>([]);
  const selectedCategory$ = useObservable<string>("");
  const drinkStock$ = useObservable<Record<string, number>>({});
  const isBarMC$ = useObservable<boolean>(false);
  const payModalVisible$ = useObservable(false);
  const adminsList$ = useObservable<AdminData[]>([]);
  const selectedAdmin$ = useObservable<string | null>(null);
  const adminPassword$ = useObservable("");
  const payingComandaId$ = useObservable<number | null>(null);
  const itemsModalOpen$ = useObservable(false);
  const selectedItemsRecord$ = useObservable<any>(null);

  const comandas = useValue(comandas$);
  const loading = useValue(loading$);
  const selectedComanda = useValue(selectedComanda$);
  const pendingItems = useValue(pendingItems$);
  const selectedCategory = useValue(selectedCategory$);
  const drinkStock = useValue(drinkStock$);
  const isBarMC = useValue(isBarMC$);
  const payModalVisible = useValue(payModalVisible$);
  const adminsList = useValue(adminsList$);
  const selectedAdmin = useValue(selectedAdmin$);
  const adminPassword = useValue(adminPassword$);
  const payingComandaId = useValue(payingComandaId$);
  const itemsModalOpen = useValue(itemsModalOpen$);
  const selectedItemsRecord = useValue(selectedItemsRecord$);
  const festaParticular = useValue(appStore$.switches.festaParticular);
  const { isMobile } = useDeviceSizes();

  const categoryLabels: Record<string, string> = {
    cervejas: tCategories('beers'),
    comidas: tCategories('comidas'),
    cervejasZero: tCategories('zeroBeers'),
    "cervejas zero": tCategories('zeroBeers'),
    cervejas_zero: tCategories('zeroBeers'),
    refrigerantes: tCategories('softDrinks'),
    bebidasNaoAlcoolicas: tCategories('nonAlcoholic'),
    energetico: tCategories('energy'),
    doses: tCategories('shots'),
    vinhos: tCategories('wines'),
    snacks: tCategories('snacks'),
    cigarros: tCategories('cigars'),
  };

  const categories = Object.keys(drinksByCategory);

  const getDrinksForCategory = (category: string): Record<string, number> => {
    if (!category || !drinksByCategory[category as keyof typeof drinksByCategory]) return {};
    const cat = drinksByCategory[category as keyof typeof drinksByCategory];
    return festaParticular ? cat.members : cat.guests;
  };

  const getExistingQuantityInComanda = (drink: string) =>
    selectedComanda?.comanda_itens.find((i: { bebida_nome: string }) => i.bebida_nome === drink)?.quantidade ?? 0;

  const addDrinkToPending = (drink: string, price: number) => {
    const exists = pendingItems.find((i) => i.drink === drink);
    if (exists) {
      pendingItems$.set((old) =>
        old.map((i) => (i.drink === drink ? { ...i, quantity: i.quantity + 1 } : i))
      );
    } else {
      pendingItems$.set((old) => [...old, { drink, quantity: 1, price }]);
    }
  };

  const closeAddDrinkDialog = () => {
    selectedComanda$.set(null);
    pendingItems$.set([]);
  };

  useEffect(() => {
    async function loadStock() {
      try {
        drinkStock$.set(await getAllStock());
      } catch {
        drinkStock$.set({});
      }
    }
    loadStock();
    // drinkStock$ is a stable Legend observable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedComanda || categories.length === 0) return;
    selectedCategory$.set(categories[0]);
    // selectedCategory$ is a stable Legend observable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedComanda?.id, categories.length]);

  const fetchAdmins = async () => {
    const { data, error } = await supabase.from("admins").select("id, email");
    if (error) {
      message.error(t('errorFetchingAdmins'));
    } else {
      adminsList$.set(data);
    }
  };

  const closePayModal = () => {
    payModalVisible$.set(false);
    selectedAdmin$.set(null);
    adminPassword$.set("");
    payingComandaId$.set(null);
  };

  const markComandaPaid = async (comandaId: number) => {
    const { data: comandaData, error: fetchError } = await supabase
      .from("comandas")
      .select("*, comanda_itens!comanda_itens_comanda_id_fkey(*)")
      .eq("id", comandaId)
      .single();

    if (fetchError || !comandaData) {
      return { ok: false as const, reason: "fetch" as const };
    }

    const valorTotal = comandaData.comanda_itens.reduce(
      (sum: number, item: any) => sum + item.quantidade * item.preco_unitario,
      0
    );

    const { error } = await supabase
      .from("comandas")
      .update({
        paga: true,
        valor_total: valorTotal,
      })
      .eq("id", comandaId);

    if (error) {
      return { ok: false as const, reason: "update" as const };
    }
    return { ok: true as const };
  };

  const handleConfirmPay = async () => {
    if (payingComandaId == null) return;

    if (isBarMC) {
      const result = await markComandaPaid(payingComandaId);
      if (!result.ok) {
        message.error(
          result.reason === "fetch"
            ? t("errorFetchingComandaData")
            : t("errorPayingComanda")
        );
      } else {
        message.success(t("comandaPaidSuccessfully"));
        fetchComandas();
      }
      closePayModal();
      return;
    }

    if (!selectedAdmin || !adminPassword) {
      message.warning(t("selectAdminAndPassword"));
      return;
    }

    const {
      data: { session: sessionToRestore },
    } = await supabase.auth.getSession();

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: selectedAdmin,
      password: adminPassword,
    });

    if (loginError) {
      message.error(t("incorrectUserOrPassword"));
      return;
    }

    try {
      const result = await markComandaPaid(payingComandaId);

      if (!result.ok) {
        message.error(
          result.reason === "fetch"
            ? t("errorFetchingComandaData")
            : t("errorPayingComanda")
        );
      } else {
        message.success(t("comandaPaidSuccessfully"));
        fetchComandas();
      }
    } finally {
      if (sessionToRestore?.access_token && sessionToRestore?.refresh_token) {
        await supabase.auth.setSession({
          access_token: sessionToRestore.access_token,
          refresh_token: sessionToRestore.refresh_token,
        });
      }
    }

    closePayModal();
  };

  const fetchComandas = async () => {
    loading$.set(true);

    const { data, error } = await supabase
      .from("comandas")
      .select("*, comanda_itens!comanda_itens_comanda_id_fkey(*)")
      .eq("paga", false)
      .order("created_at", { ascending: false });

    if (error) {
      message.error(t('errorFetchingComandas'));
    } else {
      comandas$.set(data);
    }
    loading$.set(false);
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    isBarMC$.set(user?.email === "barmc@gentlemenmc.com.br");
  };

  useEffect(() => {
    fetchComandas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => ({
    refreshData: () => {
      fetchComandas();
    },
  }));

  const handleAddDrinks = async () => {
    if (!selectedComanda || pendingItems.length === 0) return;

    for (const item of pendingItems) {
      const stock = drinkStock[item.drink] || 0;
      const existingQty = getExistingQuantityInComanda(item.drink);
      const available = stock - existingQty;
      if (available < item.quantity) {
        message.error(
          tNova('errors.insufficientStock', {
            drink: item.drink,
            available: Math.max(0, available),
            requested: item.quantity,
          })
        );
        return;
      }
    }

    let updatedItems = [...selectedComanda.comanda_itens];

    for (const pendingItem of pendingItems) {
      const drinkExists = updatedItems.find((i: { bebida_nome: string }) => i.bebida_nome === pendingItem.drink);
      if (drinkExists) {
        updatedItems = updatedItems.map((i: { bebida_nome: string; quantidade: number }) =>
          i.bebida_nome === pendingItem.drink
            ? { ...i, quantidade: i.quantidade + pendingItem.quantity }
            : i
        );
      } else {
        updatedItems = [
          ...updatedItems,
          {
            drink: pendingItem.drink,
            quantity: pendingItem.quantity,
            price: pendingItem.price,
          },
        ];
      }
    }

    const mappedItems = updatedItems.flatMap((i: { id?: number; bebida_nome?: string; drink?: string; quantidade?: number; quantity?: number; preco_unitario?: number; price?: number }) => {
      const drink = i.bebida_nome || i.drink;
      const quantity = i.quantidade ?? i.quantity;
      const price = i.preco_unitario ?? i.price;
      if (!drink || quantity == null || price == null) return [];
      return [{ id: i.id, drink, quantity, price }];
    });

    const consumed: { drink: string; quantity: number }[] = [];
    try {
      for (const item of pendingItems) {
        await consumirEstoque(item.drink, item.quantity, {
          invalidDrinkOrQuantity: tEstoqueService('errors.invalidDrinkOrQuantity'),
          insufficientStock: tEstoqueService('errors.insufficientStock', { drink: item.drink }),
        });
        consumed.push({ drink: item.drink, quantity: item.quantity });
      }

      await updateComanda({
        id: selectedComanda.id,
        guestName: selectedComanda.nome_convidado,
        items: mappedItems,
      });
    } catch (err: unknown) {
      for (const c of consumed) {
        try {
          await devolverEstoque(c.drink, c.quantity);
        } catch {
          /* rollback best-effort */
        }
      }
      message.error(err instanceof Error ? err.message : t('errorUpdatingComanda'));
      return;
    }

    message.success(t('drinksAdded'));
    closeAddDrinkDialog();
    try {
      drinkStock$.set(await getAllStock());
    } catch {
      /* ignore */
    }
    fetchComandas();
  };

  const comandasWithTotals = comandas.map((c) => ({
    ...c,
    total: c.comanda_itens.reduce((sum: number, i: any) => sum + i.quantidade * i.preco_unitario, 0),
  }));

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">{tComandas('openComandasPageHeading')}</h1>
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <>
          {/* Cards: somente abaixo do breakpoint lg */}
          <div className="block lg:hidden">
            {comandasWithTotals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('noOpenComandas')}
              </div>
            ) : (
              <div className="space-y-4">
                {comandasWithTotals.map((record) => {
                  const totalQtd = record.comanda_itens.reduce(
                    (sum: number, i: any) => sum + i.quantidade,
                    0
                  );
                  return (
                    <Card key={record.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{record.nome_convidado}</h3>
                            <p className="text-sm text-muted-foreground">{record.nome_integrante}</p>
                          </div>
                          <Badge variant="outline" className="text-lg font-semibold">
                            R$ {record.total.toFixed(2)}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">{t('phone')}</p>
                            <p>{record.telefone_convidado || '-'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{t('items')}</p>
                            <Button
                              variant="link"
                              className="h-auto p-0"
                              onClick={() => {
                                selectedItemsRecord$.set(record);
                                itemsModalOpen$.set(true);
                              }}
                            >
                              {totalQtd} {t('drinks')}
                            </Button>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 pt-2">
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => {
                              pendingItems$.set([]);
                              selectedComanda$.set(record);
                            }}
                          >
                            {t('addDrink')}
                          </Button>
                          <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={() => {
                              payingComandaId$.set(record.id);
                              if (!isBarMC) fetchAdmins();
                              payModalVisible$.set(true);
                            }}
                          >
                            {t('markAsPaid')}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tabela: somente a partir do breakpoint lg (desktop) */}
          <div className="hidden lg:block border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('name')}</TableHead>
                    <TableHead>{t('member')}</TableHead>
                    <TableHead>{t('phone')}</TableHead>
                    <TableHead>{t('items')}</TableHead>
                    <TableHead>{t('total')}</TableHead>
                    <TableHead>{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comandasWithTotals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        {t('noOpenComandas')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    comandasWithTotals.map((record) => {
                      const totalQtd = record.comanda_itens.reduce(
                        (sum: number, i: any) => sum + i.quantidade,
                        0
                      );
                      return (
                        <TableRow key={record.id}>
                          <TableCell>{record.nome_convidado}</TableCell>
                          <TableCell>{record.nome_integrante}</TableCell>
                          <TableCell>{record.telefone_convidado}</TableCell>
                          <TableCell>
                            <Button
                              variant="link"
                              onClick={() => {
                                selectedItemsRecord$.set(record);
                                itemsModalOpen$.set(true);
                              }}
                            >
                              {totalQtd} {t('drinks')}
                            </Button>
                          </TableCell>
                          <TableCell>R$ {record.total.toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  pendingItems$.set([]);
                                  selectedComanda$.set(record);
                                }}
                              >
                                {t('addDrink')}
                              </Button>
                              {/* {!isBarMC && ( */}
                                <Button
                                  variant="destructive"
                                  onClick={() => {
                                    payingComandaId$.set(record.id);
                                    fetchAdmins();
                                    payModalVisible$.set(true);
                                  }}
                                >
                                  {t('markAsPaid')}
                                </Button>
                              {/* )} */}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
          </div>
        </>
      )}
      <Dialog open={!!selectedComanda} onOpenChange={(open) => !open && closeAddDrinkDialog()}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>{t('addDrinkToComanda', { name: selectedComanda?.nome_convidado })}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 min-h-0">
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('loadingDrinks')}</p>
            ) : isMobile ? (
              <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
                <Select
                  value={selectedCategory}
                  onValueChange={(value) => selectedCategory$.set(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={tNova('selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {categoryLabels[category] || category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCategory && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {Object.keys(getDrinksForCategory(selectedCategory)).map((drink) => {
                      const stock = drinkStock[drink] || 0;
                      const hasStock = stock > 0;
                      const categoryDrinks = getDrinksForCategory(selectedCategory);
                      const price = categoryDrinks[drink] || 0;
                      const itemInCart = pendingItems.find((i) => i.drink === drink);
                      const quantityInCart = itemInCart?.quantity || 0;
                      const existingQty = getExistingQuantityInComanda(drink);
                      const canAddMore = stock > existingQty + quantityInCart;
                      return (
                        <div key={drink} className="flex flex-col items-center gap-1">
                          <Button
                            variant="outline"
                            className={!hasStock ? "opacity-50 cursor-not-allowed min-h-[4rem] whitespace-pre-wrap flex flex-col" : "min-h-[4rem] whitespace-pre-wrap flex flex-col"}
                            disabled={!hasStock || !canAddMore}
                            onClick={() => addDrinkToPending(drink, price)}
                          >
                            <span className="text-center leading-tight text-xs sm:text-sm">{drink}</span>
                            <span className="text-xs font-normal">
                              {price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </span>
                          </Button>
                          <span className={`text-xs font-semibold ${hasStock ? "text-green-600" : "text-red-600"}`}>
                            {tNova("labels.stock", { stock })}
                          </span>
                          {quantityInCart > 0 && (
                            <span className="text-xs text-blue-600 font-medium">
                              {tNova("labels.inCart", { quantity: quantityInCart })}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <Tabs
                value={selectedCategory || categories[0] || ""}
                onValueChange={(value) => selectedCategory$.set(value)}
                className="w-full min-h-0"
                defaultValue={categories[0] || ""}
              >
                <TabsList className="h-auto min-h-14 flex flex-wrap items-center justify-start gap-1 rounded-lg bg-muted p-1 text-muted-foreground w-full">
                  {categories.map((category) => (
                    <TabsTrigger key={category} value={category} className="text-xs lg:text-sm px-2 py-2 shrink-0">
                      {categoryLabels[category] || category}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {categories.map((category) => {
                  const categoryDrinks = getDrinksForCategory(category);
                  return (
                    <TabsContent key={category} value={category} className="mt-2 max-h-[50vh] overflow-y-auto">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-2">
                        {Object.keys(categoryDrinks).map((drink) => {
                          const stock = drinkStock[drink] || 0;
                          const hasStock = stock > 0;
                          const price = categoryDrinks[drink] || 0;
                          const itemInCart = pendingItems.find((i) => i.drink === drink);
                          const quantityInCart = itemInCart?.quantity || 0;
                          const existingQty = getExistingQuantityInComanda(drink);
                          const canAddMore = stock > existingQty + quantityInCart;
                          return (
                            <div key={drink} className="flex flex-col items-center gap-1">
                              <Button
                                variant="outline"
                                className={!hasStock ? "opacity-50 cursor-not-allowed min-h-[4rem] whitespace-pre-wrap flex flex-col" : "min-h-[4rem] whitespace-pre-wrap flex flex-col"}
                                disabled={!hasStock || !canAddMore}
                                onClick={() => addDrinkToPending(drink, price)}
                              >
                                <span className="text-center leading-tight text-sm">{drink}</span>
                                <span className="text-xs font-normal">
                                  {price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                </span>
                              </Button>
                              <span className={`text-xs font-semibold ${hasStock ? "text-green-600" : "text-red-600"}`}>
                                {tNova("labels.stock", { stock })}
                              </span>
                              {quantityInCart > 0 && (
                                <span className="text-xs text-blue-600 font-medium">
                                  {tNova("labels.inCart", { quantity: quantityInCart })}
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
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tNova('labels.drink')}</TableHead>
                    <TableHead>{tNova('labels.quantity')}</TableHead>
                    <TableHead>{tNova('labels.price')}</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        {tNova('labels.noItemsAdded')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingItems.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.drink}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>R$ {(item.price * item.quantity).toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => pendingItems$.set((old) => old.filter((i) => i.drink !== item.drink))}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAddDrinkDialog}>
              {t('cancel')}
            </Button>
            <Button onClick={handleAddDrinks} disabled={pendingItems.length === 0}>
              {t('add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={itemsModalOpen} onOpenChange={itemsModalOpen$.set}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('comandaItems', { name: selectedItemsRecord?.nome_convidado })}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-2">
            {selectedItemsRecord?.comanda_itens.map((item: any, idx: number) => (
              <div
                key={idx}
                className="flex justify-between border-b border-gray-300 pb-1"
              >
                <span>{item.bebida_nome}</span>
                <span>
                  {item.quantidade} x R$ {item.preco_unitario.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => itemsModalOpen$.set(false)}>{t('close')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={payModalVisible} onOpenChange={(open) => {
        if (!open) closePayModal();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('confirmPayment')}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {isBarMC ? (
              <p className="text-sm text-muted-foreground">{t('notices.paymentBarMC')}</p>
            ) : (
              <>
                <Select value={selectedAdmin || ""} onValueChange={(value) => selectedAdmin$.set(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectAdministrator')} />
                  </SelectTrigger>
                  <SelectContent>
                    {adminsList.map((admin) => (
                      <SelectItem key={admin.id} value={admin.email}>
                        {admin.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => adminPassword$.set(e.target.value)}
                  placeholder={t('adminPassword')}
                />
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closePayModal}>
              {t('cancel')}
            </Button>
            <Button onClick={handleConfirmPay}>
              {t('confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
})

OpenComandasPageContent.displayName = "OpenComandasPageContent";