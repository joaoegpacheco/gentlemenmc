"use client";

import React, { useEffect, useMemo } from "react";
import { useObservable, useValue } from "@legendapp/state/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputNumber } from "@/components/ui/input-number";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { message } from "@/lib/message";
import { addOrUpdateEstoque, getEstoque } from "@/services/estoqueService";
import { drinksPricesMembers } from "@/constants/drinks";

type EstoqueType = {
  id: string;
  drink: string;
  quantity: number;
};

const LOW_STOCK_THRESHOLD = 5;

export default function EstoquePage() {
  const stock$ = useObservable<EstoqueType[]>([]);
  const drink$ = useObservable("");
  const quantity$ = useObservable<number>(1);
  const loading$ = useObservable(false);
  const search$ = useObservable("");
  const sortedColumn$ = useObservable<"drink" | "quantity" | null>(null);
  const sortDirection$ = useObservable<"asc" | "desc">("asc");

  const stock = useValue(stock$);
  const drink = useValue(drink$);
  const quantity = useValue(quantity$);
  const loading = useValue(loading$);
  const search = useValue(search$);
  const sortedColumn = useValue(sortedColumn$);
  const sortDirection = useValue(sortDirection$);

  async function fetchStock() {
    try {
      const data = await getEstoque();
      stock$.set(data);
    } catch {
      message.error("Erro ao buscar estoque");
    }
  }

  useEffect(() => {
    fetchStock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = async () => {
    if (!drink || quantity <= 0) {
      message.error("Informe o nome da bebida e quantidade válida");
      return;
    }

    loading$.set(true);
    try {
      await addOrUpdateEstoque(drink.trim(), quantity);
      message.success("Estoque atualizado!");
      drink$.set("");
      quantity$.set(1);
      await fetchStock();
    } catch {
      message.error("Erro ao atualizar estoque");
    } finally {
      loading$.set(false);
    }
  };

  const filteredStock = useMemo(() => {
    return stock
      .filter((item) =>
        item.drink.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => a.drink.localeCompare(b.drink));
  }, [stock, search]);

  const drinksOptions = Object.keys(drinksPricesMembers).map((name) => ({
    label: name,
    value: name,
  }));

  const handleSort = (column: "drink" | "quantity") => {
    if (sortedColumn === column) {
      sortDirection$.set(sortDirection === "asc" ? "desc" : "asc");
    } else {
      sortedColumn$.set(column);
      sortDirection$.set("asc");
    }
  };

  const sortedStock = useMemo(() => {
    if (!sortedColumn) return filteredStock;
    const sorted = [...filteredStock].sort((a, b) => {
      if (sortedColumn === "drink") {
        return sortDirection === "asc" 
          ? a.drink.localeCompare(b.drink)
          : b.drink.localeCompare(a.drink);
      } else {
        return sortDirection === "asc"
          ? a.quantity - b.quantity
          : b.quantity - a.quantity;
      }
    });
    return sorted;
  }, [filteredStock, sortedColumn, sortDirection]);

  const paginatedStock = useMemo(() => {
    const pageSize = 10;
    return sortedStock.slice(0, pageSize);
  }, [sortedStock]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">📦 Controle de Estoque</h2>

      {/* Formulário de Adição */}
      <div className="border p-4 rounded-xl shadow-sm mb-6 bg-card">
        <h4 className="text-lg font-semibold mb-4">Adicionar ou atualizar bebida</h4>
        <div className="flex flex-col md:flex-row gap-4">
          <Select value={drink || ""} onValueChange={drink$.set}>
            <SelectTrigger className="w-full md:w-auto min-w-[200px]">
              <SelectValue placeholder="Selecione uma bebida" />
            </SelectTrigger>
            <SelectContent>
              {drinksOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <InputNumber
            min={1}
            value={quantity}
            onChange={(v) => quantity$.set(v ?? 1)}
            className="w-full md:w-32"
            placeholder="Quantidade"
          />
          <Button onClick={handleAdd} disabled={loading}>
            {loading ? "Carregando..." : "Adicionar ao estoque"}
          </Button>
        </div>
      </div>

      {/* Campo de busca */}
      <div className="mb-4">
        <Input
          placeholder="Buscar bebida no estoque"
          value={search}
          onChange={(e) => search$.set(e.target.value)}
        />
      </div>

      {/* Tabela de estoque */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("drink")}
              >
                Bebida {sortedColumn === "drink" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("quantity")}
              >
                Quantidade {sortedColumn === "quantity" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedStock.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground">
                  Nenhum item encontrado
                </TableCell>
              </TableRow>
            ) : (
              paginatedStock.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.drink}</TableCell>
                  <TableCell>
                    {item.quantity <= LOW_STOCK_THRESHOLD ? (
                      <Badge variant="destructive">{item.quantity} 🔻</Badge>
                    ) : (
                      <Badge variant="default">{item.quantity}</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
