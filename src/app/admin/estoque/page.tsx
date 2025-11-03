"use client";

import React, { useEffect, useState, useMemo } from "react";
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
import { BEBIDAS_PRECOS } from "@/constants/drinks";

type EstoqueType = {
  id: string;
  drink: string;
  quantity: number;
};

const LOW_STOCK_THRESHOLD = 5;

export default function EstoquePage() {
  const [stock, setStock] = useState<EstoqueType[]>([]);
  const [drink, setDrink] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  async function fetchStock() {
    try {
      const data = await getEstoque();
      setStock(data);
    } catch {
      message.error("Erro ao buscar estoque");
    }
  }

  useEffect(() => {
    fetchStock();
  }, []);

  const handleAdd = async () => {
    if (!drink || quantity <= 0) {
      message.error("Informe o nome da bebida e quantidade válida");
      return;
    }

    setLoading(true);
    try {
      await addOrUpdateEstoque(drink.trim(), quantity);
      message.success("Estoque atualizado!");
      setDrink("");
      setQuantity(1);
      await fetchStock();
    } catch {
      message.error("Erro ao atualizar estoque");
    } finally {
      setLoading(false);
    }
  };

  const filteredStock = useMemo(() => {
    return stock
      .filter((item) =>
        item.drink.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => a.drink.localeCompare(b.drink));
  }, [stock, search]);

  const drinksOptions = Object.keys(BEBIDAS_PRECOS).map((name) => ({
    label: name,
    value: name,
  }));

  const [sortedColumn, setSortedColumn] = useState<"drink" | "quantity" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (column: "drink" | "quantity") => {
    if (sortedColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortedColumn(column);
      setSortDirection("asc");
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
      <div className="border p-4 rounded-xl shadow-sm mb-6 bg-white">
        <h4 className="text-lg font-semibold mb-4">Adicionar ou atualizar bebida</h4>
        <div className="flex flex-col md:flex-row gap-4">
          <Select value={drink || ""} onValueChange={setDrink}>
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
            onChange={(v) => setQuantity(v ?? 1)}
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
          onChange={(e) => setSearch(e.target.value)}
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
