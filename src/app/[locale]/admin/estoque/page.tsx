"use client";

import React, { useEffect, useMemo } from "react";
import { useObservable, useValue } from "@legendapp/state/react";
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, Check } from "lucide-react";
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
  const t = useTranslations();
  const stock$ = useObservable<EstoqueType[]>([]);
  const drink$ = useObservable("");
  const quantity$ = useObservable<number>(1);
  const valuePrice$ = useObservable<string>("");
  const loading$ = useObservable(false);
  const search$ = useObservable("");
  const sortedColumn$ = useObservable<"drink" | "quantity" | null>(null);
  const sortDirection$ = useObservable<"asc" | "desc">("asc");
  const currentPage$ = useObservable<number>(1);
  const pageSize$ = useObservable<number>(20);
  const drinkSearch$ = useObservable("");
  const drinkPopoverOpen$ = useObservable(false);

  const stock = useValue(stock$);
  const drink = useValue(drink$);
  const quantity = useValue(quantity$);
  const valuePrice = useValue(valuePrice$);
  const loading = useValue(loading$);
  const search = useValue(search$);
  const sortedColumn = useValue(sortedColumn$);
  const sortDirection = useValue(sortDirection$);
  const currentPage = useValue(currentPage$);
  const pageSize = useValue(pageSize$);
  const drinkSearch = useValue(drinkSearch$);
  const drinkPopoverOpen = useValue(drinkPopoverOpen$);

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

    const priceValue = valuePrice ? parseFloat(valuePrice.replace(/[^\d,.-]/g, "").replace(",", ".")) : null;
    if (priceValue !== null && (isNaN(priceValue) || priceValue < 0)) {
      message.error("Informe um valor válido");
      return;
    }

    loading$.set(true);
    try {
      await addOrUpdateEstoque(drink.trim(), quantity, priceValue);
      message.success("Estoque atualizado!");
      drink$.set("");
      quantity$.set(1);
      valuePrice$.set("");
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

  const filteredDrinksOptions = useMemo(() => {
    if (!drinkSearch) return drinksOptions;
    return drinksOptions.filter((option) =>
      option.label.toLowerCase().includes(drinkSearch.toLowerCase())
    );
  }, [drinksOptions, drinkSearch]);

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
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedStock.slice(startIndex, endIndex);
  }, [sortedStock, currentPage, pageSize]);

  const totalPages = useMemo(() => {
    return Math.ceil(sortedStock.length / pageSize);
  }, [sortedStock.length, pageSize]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      currentPage$.set(newPage);
    }
  };

  // Reset page when search or sort changes
  useEffect(() => {
    currentPage$.set(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sortedColumn, sortDirection]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">📦 Controle de Estoque</h2>

      {/* Formulário de Adição */}
      <div className="border p-4 rounded-xl shadow-sm mb-6 bg-card">
        <h4 className="text-lg font-semibold mb-4">Adicionar ou atualizar bebida</h4>
        <div className="flex flex-col md:flex-row gap-4">
          <Popover open={drinkPopoverOpen} onOpenChange={drinkPopoverOpen$.set}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full md:w-full min-w-[200px] justify-between"
              >
                {drink
                  ? drinksOptions.find((option) => option.value === drink)?.label
                  : "Selecione uma bebida"}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <div className="p-2">
                <Input
                  placeholder="Buscar bebida..."
                  value={drinkSearch}
                  onChange={(e) => drinkSearch$.set(e.target.value)}
                  className="mb-2"
                />
              </div>
              <div className="max-h-[300px] overflow-auto">
                {filteredDrinksOptions.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Nenhuma bebida encontrada
                  </div>
                ) : (
                  filteredDrinksOptions.map((option) => (
                    <div
                      key={option.value}
                      className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-accent"
                      onClick={() => {
                        drink$.set(option.value);
                        drinkPopoverOpen$.set(false);
                        drinkSearch$.set("");
                      }}
                    >
                      <span>{option.label}</span>
                      {drink === option.value && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
          <Input
            type="text"
            inputMode="numeric"
            value={quantity.toString()}
            onChange={(e) => {
              const value = e.target.value;
              // Remove tudo que não é número
              const numericValue = value.replace(/\D/g, "");
              // Se estiver vazio, define como 0, senão converte para número
              const numValue = numericValue === "" ? 0 : parseInt(numericValue, 10);
              // Garante que o valor mínimo seja 0
              quantity$.set(Math.max(0, numValue));
            }}
            className="w-full md:w-32"
            placeholder="Quantidade"
          />
          <Input
            type="text"
            inputMode="decimal"
            value={valuePrice}
            onChange={(e) => {
              let value = e.target.value;
              // Remove tudo exceto números, vírgula e ponto
              value = value.replace(/[^\d,.-]/g, "");
              // Permite apenas uma vírgula ou ponto
              const parts = value.split(/[,.]/);
              if (parts.length > 2) {
                value = parts[0] + "." + parts.slice(1).join("");
              }
              valuePrice$.set(value);
            }}
            className="w-full md:w-32"
            placeholder="Valor pago (R$)"
          />
          <Button onClick={handleAdd} disabled={loading}>
            {loading ? t('common.loading') : t('dashboard.addToStock')}
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

      {/* Paginação */}
      {sortedStock.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
          <div className="text-sm text-muted-foreground">
            Mostrando {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, sortedStock.length)} de {sortedStock.length} itens
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  // Mostra primeira página, última página, página atual e páginas adjacentes
                  return (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  );
                })
                .map((page, index, array) => {
                  // Adiciona "..." entre páginas não consecutivas
                  const prevPage = array[index - 1];
                  const showEllipsis = prevPage && page - prevPage > 1;
                  
                  return (
                    <React.Fragment key={page}>
                      {showEllipsis && (
                        <span className="px-2 text-muted-foreground">...</span>
                      )}
                      <Button
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="min-w-[40px]"
                      >
                        {page}
                      </Button>
                    </React.Fragment>
                  );
                })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
