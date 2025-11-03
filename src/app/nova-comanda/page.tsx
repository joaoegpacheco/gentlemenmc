"use client";

import React from "react";
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
import { DRINKS_PRICES } from "@/constants/drinks";
import { consumirEstoque } from "@/services/estoqueService";
import { supabase } from "@/hooks/use-supabase.js";

export default function CreateComandaPage() {
  const items$ = useObservable<{ drink: string; quantity: number; price: number }[]>([]);
  const guestName$ = useObservable<string>("");
  const guestPhone$ = useObservable<string>("");
  const isDirectSale$ = useObservable<boolean>(false);

  const items = useValue(items$);
  const guestName = useValue(guestName$);
  const guestPhone = useValue(guestPhone$);
  const isDirectSale = useValue(isDirectSale$);

  const handleCreateComanda = async () => {
    if (!guestName) {
      message.error("Informe nome do convidado");
      return;
    }
    
    if (items.length === 0) {
      message.error("Adicione ao menos 1 item");
      return;
    }

    try {
      // Consome estoque
      for (const item of items) {
        await consumirEstoque(item.drink, item.quantity);
      }

      // Cria a comanda
      const order = await registerComanda({
        guestName: guestName || undefined,
        guestPhone: guestPhone || undefined,
        items,
      });

      // Se for venda direta, marca a comanda como paga
      if (isDirectSale) {
        const { error: updateError } = await supabase
          .from("comandas")
          .update({ paga: true })
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
          await printComandaHTML({ guestName: guestName || "Sem nome", items });
        }
      }

      // Limpa formulário
      items$.set([]);
      guestName$.set("");
      guestPhone$.set("");
      isDirectSale$.set(false);
    } catch (error: any) {
      message.error(`Erro: ${error.message || "Erro ao processar"}`);
    }
  };

  const total = items.reduce((sum, i) => sum + i.quantity * i.price, 0);

  return (
    <div className="p-4 flex flex-col gap-25">
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="flex flex-col w-full">
          <label className="text-sm mb-1">Nome do convidado</label>
          <Input
            placeholder="Falano de tal"
            value={guestName}
            onChange={(e) => guestName$.set(e.target.value)}
          />
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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 p-6 mb-6">
        {Object.entries(DRINKS_PRICES).map(([drink, price]) => (
          <Button
            key={drink}
            variant="outline"
            size="lg"
            className="h-24 text-lg whitespace-pre-wrap flex flex-col gap-2"
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
            {drink}
            <span className="text-sm">R$ {price.toFixed(2)}</span>
          </Button>
        ))}
      </div>

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
