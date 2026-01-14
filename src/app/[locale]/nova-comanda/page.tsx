"use client";

import React, { useEffect } from "react";
import { useObservable, useValue } from "@legendapp/state/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { message } from "@/lib/message";
import { Plus, Trash2 } from "lucide-react";
import { registerComanda } from "@/services/comandaService";
import { drinksPricesGuests, drinksByCategory } from "@/constants/drinks";
import { consumirEstoque, getEstoqueByDrink } from "@/services/estoqueService";
import { supabase } from "@/hooks/use-supabase.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useMediaQuery } from "react-responsive";

export default function CreateComandaPage() {
  const items$ = useObservable<{ drink: string; quantity: number; price: number }[]>([]);
  const guestName$ = useObservable<string>("");
  const memberName$ = useObservable<string>("");
  const guestPhone$ = useObservable<string>("");
  const isDirectSale$ = useObservable<boolean>(false);
  const drinkStock$ = useObservable<Record<string, number>>({});
  const selectedCategory$ = useObservable<string>("");
  const selectedUUID$ = useObservable<string>("");
  const members$ = useObservable<{ user_id: string; user_name: string }[]>([]);

  const items = useValue(items$);
  const guestName = useValue(guestName$);
  const memberName = useValue(memberName$);
  const guestPhone = useValue(guestPhone$);
  const isDirectSale = useValue(isDirectSale$);
  const drinkStock = useValue(drinkStock$);
  const selectedCategory = useValue(selectedCategory$);
  const selectedUUID = useValue(selectedUUID$);
  const members = useValue(members$);

  // Mapeamento de categorias para nomes amigáveis
  const categoryLabels: Record<string, string> = {
    cervejas: "Cervejas",
    cervejasPremium: "Cervejas Premium",
    refrigerantes: "Refrigerantes",
    bebidasNaoAlcoolicas: "Bebidas Não Alcoólicas",
    energetico: "Energético",
    doses: "Doses",
    vinhos: "Vinhos",
    snacks: "Snacks",
    cigarros: "Cigarros",
  };

  // Obter lista de categorias
  const categories = Object.keys(drinksByCategory);

  // Obter bebidas da categoria selecionada (para guests)
  const getDrinksForCategory = (category: string): Record<string, number> => {
    if (!category || !drinksByCategory[category as keyof typeof drinksByCategory]) return {};
    return drinksByCategory[category as keyof typeof drinksByCategory].guests;
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
    async function fetchAllStock() {
      const stockMap: Record<string, number> = {};
      for (const drink of Object.keys(drinksPricesGuests)) {
        const quantity = await getEstoqueByDrink(drink);
        stockMap[drink] = quantity;
      }
      drinkStock$.set(stockMap);
    }

    fetchAllStock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function fetchMembers() {
      const { data, error } = await supabase
        .from("membros")
        .select("user_id, user_name")
        .order("user_name");

      if (!error && data) {
        members$.set(data);
      }
    }

    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateComanda = async () => {
    if (!guestName) {
      message.error("Informe nome do convidado");
      return;
    }

    if (items.length === 0) {
      message.error("Adicione ao menos 1 item");
      return;
    }

    // Valida estoque antes de criar comanda
    for (const item of items) {
      const stock = drinkStock[item.drink] || 0;
      if (stock < item.quantity) {
        message.error(`Estoque insuficiente para ${item.drink}. Disponível: ${stock}, Solicitado: ${item.quantity}`);
        return;
      }
    }

    try {
      // Consome estoque
      for (const item of items) {
        await consumirEstoque(item.drink, item.quantity);
        // Atualiza o estoque local após consumo
        const newStock = await getEstoqueByDrink(item.drink);
        drinkStock$.set({ ...drinkStock, [item.drink]: newStock });
      }

      // Busca o nome do membro selecionado
      const selectedMemberName = selectedUUID 
        ? members.find(m => m.user_id === selectedUUID)?.user_name || undefined
        : memberName || undefined;

      // Cria a comanda
      const order = await registerComanda({
        guestName: guestName || undefined,
        memberName: selectedMemberName,
        guestPhone: guestPhone || undefined,
        items,
      });

      // Se for venda direta, marca a comanda como paga
      if (isDirectSale) {
        // Calcula o valor total
        const valorTotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

        const { error: updateError } = await supabase
          .from("comandas")
          .update({
            paga: true,
            valor_total: valorTotal
          })
          .eq("id", order.id);

        if (updateError) {
          message.error(`Erro ao marcar comanda como paga: ${updateError.message}`);
          return;
        }

        message.success("Venda direta realizada com sucesso");
      } else {
        message.success("Comanda criada com sucesso");

        if (typeof window !== "undefined") {
          const { printComandaHTML } = await import("@/utils-client/printComandaHTML");
          printComandaHTML({ guestName: guestName || "Sem nome", items });
        }
      }

      // Limpa formulário
      items$.set([]);
      guestName$.set("");
      guestPhone$.set("");
      selectedUUID$.set("");
      isDirectSale$.set(false);

      // Atualiza todo o estoque após criar a comanda
      const stockMap: Record<string, number> = {};
      for (const drink of Object.keys(drinksPricesGuests)) {
        const quantity = await getEstoqueByDrink(drink);
        stockMap[drink] = quantity;
      }
      drinkStock$.set(stockMap);
    } catch (error: any) {
      message.error(`Erro: ${error.message || "Erro ao processar"}`);
    }
  };

  const total = items.reduce((sum, i) => sum + i.quantity * i.price, 0);

  return (
    <div className="p-4 flex flex-col gap-25">
      {!isDirectSale && (
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-2 flex-row w-full">
            <div className="flex flex-col w-full">
              <label className="text-sm mb-1">Nome do convidado</label>
              <Input
                placeholder="Falano de tal"
                value={guestName}
                onChange={(e) => guestName$.set(e.target.value)}
              />
            </div>
            <div className="flex flex-col w-full">
              <label className="text-sm mb-1">Convidado do</label>
              <Select value={selectedUUID || ""} onValueChange={(value) => selectedUUID$.set(value)}>
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
            </div>
          </div>
          <div className="flex flex-col w-full">
            <label className="text-sm mb-1">Telefone do convidado</label>
            <Input
              placeholder="(XX) 9XXXX-XXXX"
              value={guestPhone}
              maxLength={15}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, "");
                const formatted = raw.replace(
                  /^(\d{2})(\d{5})(\d{4}).*/,
                  "($1) $2-$3"
                );
                e.target.value = formatted
                guestPhone$.set(formatted);
              }}
            />
          </div>
        </div>
      )}
      <div className="mb-4 flex items-center space-x-2">
        <Checkbox
          id="directSale"
          checked={isDirectSale}
          onCheckedChange={(checked) => isDirectSale$.set(checked === true)}
        />
        <label
          htmlFor="directSale"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Venda direta (pagamento automático)
        </label>
      </div>

      {isMobile ? (
        <div className="mb-6 space-y-4">
          <Select
            value={selectedCategory}
            onValueChange={(value) => {
              selectedCategory$.set(value);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma categoria" />
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Object.keys(getDrinksForCategory(selectedCategory)).map(drink => {
                const stock = drinkStock[drink] || 0;
                const hasStock = stock > 0;
                const itemInCart = items.find((i) => i.drink === drink);
                const quantityInCart = itemInCart?.quantity || 0;
                const canAddMore = stock > quantityInCart;
                const categoryDrinks = getDrinksForCategory(selectedCategory);
                const price = categoryDrinks[drink] || 0;

                return (
                  <div key={drink} className="flex flex-col items-center gap-1">
                    <Button
                      variant="outline"
                      className={!hasStock ? "opacity-50 cursor-not-allowed" : ""}
                      disabled={!hasStock || !canAddMore}
                      onClick={() => {
                        const exists = items.find((i) => i.drink === drink);
                        if (exists) {
                          items$.set((old) =>
                            old.map((i) =>
                              i.drink === drink ? { ...i, quantity: i.quantity + 1 } : i
                            )
                          );
                        } else {
                          items$.set((old) => [...old, { drink, quantity: 1, price }]);
                        }
                      }}
                    >
                      {`${drink} ${price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
                    </Button>
                    <span className={`text-xs font-semibold ${hasStock ? 'text-green-600' : 'text-red-600'}`}>
                      Estoque: {stock}
                    </span>
                    {quantityInCart > 0 && (
                      <span className="text-xs text-blue-600 font-medium">
                        No carrinho: {quantityInCart}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="mb-6">
          <Tabs
            value={selectedCategory || categories[0] || ""}
            onValueChange={(value) => {
              selectedCategory$.set(value);
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 p-6">
                    {Object.keys(categoryDrinks).map(drink => {
                      const stock = drinkStock[drink] || 0;
                      const hasStock = stock > 0;
                      const itemInCart = items.find((i) => i.drink === drink);
                      const quantityInCart = itemInCart?.quantity || 0;
                      const canAddMore = stock > quantityInCart;
                      const price = categoryDrinks[drink] || 0;

                      return (
                        <div key={drink} className="flex flex-col items-center gap-1">
                          <Button
                            variant="outline"
                            className={!hasStock ? "opacity-50 cursor-not-allowed" : ""}
                            disabled={!hasStock || !canAddMore}
                            onClick={() => {
                              const exists = items.find((i) => i.drink === drink);
                              if (exists) {
                                items$.set((old) =>
                                  old.map((i) =>
                                    i.drink === drink ? { ...i, quantity: i.quantity + 1 } : i
                                  )
                                );
                              } else {
                                items$.set((old) => [...old, { drink, quantity: 1, price }]);
                              }
                            }}
                          >
                            {`${drink} ${price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
                          </Button>
                          <span className={`text-xs font-semibold ${hasStock ? 'text-green-600' : 'text-red-600'}`}>
                            Estoque: {stock}
                          </span>
                          {quantityInCart > 0 && (
                            <span className="text-xs text-blue-600 font-medium">
                              No carrinho: {quantityInCart}
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
        </div>
      )}

      <div className="border rounded-lg mb-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bebida</TableHead>
              <TableHead>Qtd</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Nenhum item adicionado
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell>{item.drink}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>R$ {(item.price * item.quantity).toFixed(2)}</TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => items$.set((old) => old.filter((i) => i.drink !== item.drink))}
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

      <div className="flex justify-between items-center">
        <div className="m-6 text-xl font-bold">Total: R$ {total.toFixed(2)}</div>
        <Button onClick={handleCreateComanda}>
          <Plus className="h-4 w-4 mr-2" />
          {isDirectSale ? "Criar Venda Direta" : "Criar Comanda"}
        </Button>
      </div>
    </div>
  );
}
