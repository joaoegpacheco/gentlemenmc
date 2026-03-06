"use client";

import { useEffect, useMemo } from "react";
import { useObservable, useValue } from "@legendapp/state/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pencil } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { message } from "@/lib/message";
import {
  addOrUpdateEstoque,
  getEstoque,
  updateEstoque,
} from "@/services/estoqueService";
import { useDeviceSizes } from "@/utils/mediaQueries";
import { Card, CardContent } from "@/components/ui/card";

type EstoqueType = {
  id: string;
  drink: string;
  quantity: number;
};

const LOW_STOCK_THRESHOLD = 5;

export default function EstoquePage() {
  const t = useTranslations("stock");
  const tCommon = useTranslations("common");
  const tDashboard = useTranslations("dashboard");

  const stock$ = useObservable<EstoqueType[]>([]);
  const drink$ = useObservable("");
  const quantity$ = useObservable<number>(1);
  const editingId$ = useObservable<string | null>(null);

  const loading$ = useObservable(false);
  const search$ = useObservable("");

  const currentPage$ = useObservable<number>(1);
  const pageSize$ = useObservable<number>(20);

  const stock = useValue(stock$);
  const drink = useValue(drink$);
  const quantity = useValue(quantity$);
  const editingId = useValue(editingId$);

  const loading = useValue(loading$);
  const search = useValue(search$);
  const currentPage = useValue(currentPage$);
  const pageSize = useValue(pageSize$);

  const { isMobile } = useDeviceSizes();

  async function fetchStock() {
    try {
      const data = await getEstoque();
      stock$.set(data);
    } catch {
      message.error(t("errorFetchingStock"));
    }
  }

  useEffect(() => {
    fetchStock();
  }, []);

  useEffect(() => {
    currentPage$.set(1);
  }, [search]);

  const handleEdit = (item: EstoqueType) => {
    editingId$.set(item.id);
    drink$.set(item.drink);
    quantity$.set(item.quantity);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAdd = async () => {
    if (!drink || quantity <= 0) {
      message.error(t("informDrinkAndQuantity"));
      return;
    }

    loading$.set(true);

    try {
      if (editingId) {
        await updateEstoque(editingId, quantity);
        message.success("Estoque atualizado");
      } else {
        await addOrUpdateEstoque(drink.trim(), quantity);
        message.success(t("stockUpdated"));
      }

      drink$.set("");
      quantity$.set(1);
      editingId$.set(null);

      await fetchStock();
    } catch {
      message.error(t("errorUpdatingStock"));
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

  const totalPages = Math.ceil(filteredStock.length / pageSize);

  const paginatedStock = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredStock.slice(startIndex, startIndex + pageSize);
  }, [filteredStock, currentPage, pageSize]);

  return (
    <div className="p-6 max-w-4xl mx-auto">

      <h2 className="text-2xl font-bold mb-6">{t("stockControl")}</h2>

      {/* FORM */}

      <div className="border p-4 rounded-xl shadow-sm mb-6 bg-card">

        <h4 className="text-lg font-semibold mb-4">
          {t("addOrUpdateDrink")}
        </h4>

        <div className="flex flex-col md:flex-row gap-4">

          <Input
            value={drink}
            onChange={(e) => drink$.set(e.target.value)}
            placeholder={t("selectDrink")}
          />

          <Input
            type="number"
            value={quantity}
            onChange={(e) => quantity$.set(Number(e.target.value))}
            className="w-full md:w-32"
          />

          <Button onClick={handleAdd} disabled={loading}>
            {loading
              ? tCommon("loading")
              : editingId
              ? "Atualizar"
              : tDashboard("addToStock")}
          </Button>

        </div>

      </div>

      {/* SEARCH */}

      <div className="mb-4">
        <Input
          placeholder="Buscar bebida..."
          value={search}
          onChange={(e) => search$.set(e.target.value)}
        />
      </div>

      {/* MOBILE */}

      {isMobile && (

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {paginatedStock.map((item) => (

            <Card key={item.id}>

              <CardContent className="p-4">

                <div className="flex items-center justify-between">

                  <h3 className="font-semibold">{item.drink}</h3>

                  <div className="flex items-center gap-2">

                    {item.quantity <= LOW_STOCK_THRESHOLD ? (
                      <Badge variant="destructive">
                        {item.quantity} 🔻
                      </Badge>
                    ) : (
                      <Badge>{item.quantity}</Badge>
                    )}

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                  </div>

                </div>

              </CardContent>

            </Card>

          ))}

        </div>

      )}

      {/* DESKTOP */}

      {!isMobile && (

        <div className="border rounded-lg">

          <Table>

            <TableHeader>

              <TableRow>

                <TableHead>{t("drinkColumn")}</TableHead>
                <TableHead>{t("quantityColumn")}</TableHead>
                <TableHead>Ações</TableHead>

              </TableRow>

            </TableHeader>

            <TableBody>

              {paginatedStock.map((item) => (

                <TableRow key={item.id}>

                  <TableCell>{item.drink}</TableCell>

                  <TableCell>

                    {item.quantity <= LOW_STOCK_THRESHOLD ? (
                      <Badge variant="destructive">
                        {item.quantity} 🔻
                      </Badge>
                    ) : (
                      <Badge>{item.quantity}</Badge>
                    )}

                  </TableCell>

                  <TableCell>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                  </TableCell>

                </TableRow>

              ))}

            </TableBody>

          </Table>

        </div>

      )}

      {/* PAGINATION */}

      <div className="flex items-center justify-between mt-6">

        <Button
          variant="outline"
          disabled={currentPage === 1}
          onClick={() => currentPage$.set(currentPage - 1)}
        >
          Anterior
        </Button>

        <span className="text-sm">
          Página {currentPage} de {totalPages || 1}
        </span>

        <Button
          variant="outline"
          disabled={currentPage >= totalPages}
          onClick={() => currentPage$.set(currentPage + 1)}
        >
          Próxima
        </Button>

      </div>

    </div>
  );
}