"use client";

import { useEffect, useMemo, useState } from "react";
import { useObservable, useValue } from "@legendapp/state/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Pencil } from "lucide-react";
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
  addOrUpdateEstoqueGlobal,
  getEstoqueGlobal,
  updateEstoqueGlobal,
} from "@/services/estoqueGlobalService";
import { transferirParaEstoqueConsumo } from "@/services/estoqueService";
import { createDrink } from "@/services/drinksService";
import { useDrinks } from "@/hooks/useDrinks";

type EstoqueGlobalType = {
  id: string;
  drink_id: string;
  drink_name: string;
  quantity: number;
};

const LOW_STOCK_THRESHOLD = 5;

export default function EstoqueGlobalPage() {
  const { drinksByCategory } = useDrinks();

  const t = useTranslations("globalStock");
  const tCommon = useTranslations("common");
  const tStock = useTranslations("stock");

  const stock$ = useObservable<EstoqueGlobalType[]>([]);
  const drink$ = useObservable("");
  const quantity$ = useObservable<number>(0);
  const editingId$ = useObservable<string | null>(null);
  const loading$ = useObservable(false);
  const transferring$ = useObservable(false);
  const search$ = useObservable("");

  const stock = useValue(stock$);
  const drink = useValue(drink$);
  const quantity = useValue(quantity$);
  const editingId = useValue(editingId$);
  const loading = useValue(loading$);
  const transferring = useValue(transferring$);
  const search = useValue(search$);

  const [transferDrinkId, setTransferDrinkId] = useState("");
  const [transferQty, setTransferQty] = useState(1);

  const [categoria, setCategoria] = useState("");
  const [nome, setNome] = useState("");
  const [precoCusto, setPrecoCusto] = useState(0);
  const [precoMembro, setPrecoMembro] = useState(0);
  const [precoConvidado, setPrecoConvidado] = useState(0);
  const [isNewDrink, setIsNewDrink] = useState(false);

  async function fetchStock() {
    try {
      const data = await getEstoqueGlobal();
      stock$.set(data);
    } catch {
      message.error(t("errorFetchingStock"));
    }
  }

  useEffect(() => {
    fetchStock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(() => {
    return Object.entries(drinksByCategory || {})
      .map(([catName, catData]) => {
        const category = catData as { id?: string };
        return {
          id: category.id ?? "",
          name: catName,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [drinksByCategory]);

  const drinksFromCategory = useMemo(() => {
    if (!categoria) return [];
    type CategoryWithItems = {
      items?: { id: string; category_id: string; name: string; cost_price?: number }[];
    };
    return (Object.values(drinksByCategory || {}) as CategoryWithItems[])
      .flatMap((cat) => cat.items || [])
      .filter((d) => d.category_id === categoria)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [categoria, drinksByCategory]);

  const brlFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  function parseCurrency(value: string) {
    const numbers = value.replace(/\D/g, "");
    return Number(numbers) / 100;
  }

  const handleEdit = (item: EstoqueGlobalType) => {
    editingId$.set(item.id);
    drink$.set(item.drink_id);
    quantity$.set(item.quantity);
    setIsNewDrink(false);

    const catName = Object.keys(drinksByCategory).find((cat) =>
      drinksByCategory[cat].items.some((d: { id: string }) => d.id === item.drink_id)
    );

    if (catName) {
      const drinkItem = drinksByCategory[catName].items.find(
        (d: { id: string }) => d.id === item.drink_id
      );

      if (drinkItem) {
        setCategoria(drinkItem.category_id);
        setNome(drinkItem.name);
        setPrecoCusto(drinkItem.cost_price || 0);
        setPrecoMembro(drinksByCategory[catName].members?.[drinkItem.name] || 0);
        setPrecoConvidado(drinksByCategory[catName].guests?.[drinkItem.name] || 0);
      }
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAdd = async () => {
    if (quantity < 0) {
      message.error(t("informDrinkAndQuantity"));
      return;
    }

    if (!editingId && isNewDrink) {
      if (!categoria || !nome) {
        message.error(t("informCategoryAndName"));
        return;
      }
    } else if (!drink) {
      message.error(t("informDrinkAndQuantity"));
      return;
    }

    loading$.set(true);
    try {
      if (editingId) {
        await updateEstoqueGlobal(editingId, quantity);
        message.success(t("stockUpdated"));
      } else {
        let drinkIdToUse = drink;

        if (isNewDrink) {
          const newDrink = await createDrink({
            name: nome,
            categoryId: categoria,
            costPrice: precoCusto,
            priceMember: precoMembro,
            priceGuest: precoConvidado,
          });

          drinkIdToUse = newDrink?.id;
        }

        await addOrUpdateEstoqueGlobal(drinkIdToUse, quantity, precoCusto);
        message.success(t("stockAdded"));
      }

      drink$.set("");
      quantity$.set(0);
      editingId$.set(null);
      setCategoria("");
      setNome("");
      setPrecoCusto(0);
      setPrecoMembro(0);
      setPrecoConvidado(0);
      setIsNewDrink(false);

      await fetchStock();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : t("errorUpdatingStock"));
    } finally {
      loading$.set(false);
    }
  };

  const handleTransfer = async (drinkId?: string, qty?: number) => {
    const id = drinkId ?? transferDrinkId;
    const amount = qty ?? transferQty;

    if (!id || amount <= 0) {
      message.error(tStock("informDrinkAndQuantity"));
      return;
    }

    transferring$.set(true);
    try {
      await transferirParaEstoqueConsumo(id, amount, null, {
        invalidDrinkOrQuantity: tStock("informDrinkAndQuantity"),
        insufficientGlobalStock: tStock("insufficientGlobalStock"),
      });
      message.success(tStock("transferredFromGlobal"));
      setTransferDrinkId("");
      setTransferQty(1);
      await fetchStock();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : tStock("errorUpdatingStock"));
    } finally {
      transferring$.set(false);
    }
  };

  const sortedStock = useMemo(() => {
    return [...stock].sort((a, b) => a.drink_name.localeCompare(b.drink_name));
  }, [stock]);

  const filteredStock = useMemo(() => {
    return stock
      .filter((item) =>
        item.drink_name.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => a.drink_name.localeCompare(b.drink_name));
  }, [stock, search]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">{t("title")}</h2>
      <p className="text-muted-foreground mb-6">{t("description")}</p>

      <div className="border p-4 rounded-xl shadow-sm mb-6 bg-card">
        <h4 className="text-lg font-semibold mb-4">{t("addOrUpdateDrink")}</h4>
        <div className="flex flex-col md:flex-row gap-2 items-center flex-wrap md:justify-between">
          <div className="flex flex-col items-center gap-2">
          <select
              value={categoria}
              onChange={(e) => {
                setCategoria(e.target.value);
                drink$.set("");
                setNome("");
                setPrecoCusto(0);
                setPrecoMembro(0);
                setPrecoConvidado(0);
                setIsNewDrink(false);
              }}
              className="border rounded-md p-2 w-48"
            >
              <option value="">{t("selectCategory")}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            
            {!editingId && (
              <div className="flex items-center rounded-md p-2 w-36">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isNewDrink}
                    onChange={(e) => {
                      setIsNewDrink(e.target.checked);
                      drink$.set("");
                      if (!e.target.checked) {
                        setNome("");
                        setPrecoCusto(0);
                        setPrecoMembro(0);
                        setPrecoConvidado(0);
                      }
                    }}
                    disabled={!categoria}
                  />
                  {t("newDrink")}
                </label>
              </div>
            )}

            {isNewDrink && !editingId ? (
              <Input
                placeholder={t("drinkNamePlaceholder")}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-48"
                disabled={!categoria}
              />
            ) : (
              <select
                value={drink}
                onChange={(e) => {
                  const selected = drinksFromCategory.find((d) => d.id === e.target.value);
                  const catName = categories.find((c) => c.id === categoria)?.name;
                  drink$.set(e.target.value);
                  setNome(selected?.name || "");
                  setPrecoCusto(selected?.cost_price ?? 0);
                  setPrecoMembro(catName ? drinksByCategory?.[catName]?.members?.[selected?.name ?? ""] ?? 0 : 0);
                  setPrecoConvidado(catName ? drinksByCategory?.[catName]?.guests?.[selected?.name ?? ""] ?? 0 : 0);
                }}
                className="border rounded-md p-2 w-48"
                disabled={!categoria}
              >
                <option value="">{t("selectDrink")}</option>
                {drinksFromCategory.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            )}

            <div className="flex gap-2 items-center">
              <label className="flex items-center gap-2 text-sm">{t("quantity")}</label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => quantity$.set(Number(e.target.value))}
                className="w-24"
              />
            </div>
          </div>

          <div className="flex md:flex-row flex-col items-center gap-2">
            <div>
              <label className="flex items-center gap-2 text-sm">{t("costPrice")}</label>
              <Input
                placeholder={t("costPrice")}
                value={brlFormatter.format(precoCusto)}
                onChange={(e) => setPrecoCusto(parseCurrency(e.target.value))}
                className="w-32"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm">{t("memberPrice")}</label>
              <Input
                placeholder={t("memberPrice")}
                value={brlFormatter.format(precoMembro)}
                onChange={(e) => setPrecoMembro(parseCurrency(e.target.value))}
                className="w-32"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm">{t("guestPrice")}</label>
              <Input
                placeholder={t("guestPrice")}
                value={brlFormatter.format(precoConvidado)}
                onChange={(e) => setPrecoConvidado(parseCurrency(e.target.value))}
                className="w-32"
              />
            </div>
          </div>

          <Button onClick={handleAdd} disabled={loading}>
            {loading ? tCommon("loading") : editingId ? t("update") : t("addToGlobal")}
          </Button>
        </div>
      </div>

      <div className="border p-4 rounded-xl shadow-sm mb-6 bg-card">
        <h4 className="text-lg font-semibold mb-1">{tStock("transferFromGlobal")}</h4>
        <p className="text-sm text-muted-foreground mb-4">{t("transferHint")}</p>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-sm text-muted-foreground">{t("selectDrink")}</label>
            <select
              value={transferDrinkId}
              onChange={(e) => setTransferDrinkId(e.target.value)}
              className="border rounded-md p-2 w-56 mt-1 block"
            >
              <option value="">{t("selectDrink")}</option>
              {sortedStock.map((item) => (
                <option key={item.drink_id} value={item.drink_id}>
                  {item.drink_name} ({item.quantity})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">{t("quantity")}</label>
            <Input
              type="number"
              min={1}
              value={transferQty}
              onChange={(e) => setTransferQty(Number(e.target.value))}
              className="w-24 mt-1"
            />
          </div>
          <Button
            onClick={() => handleTransfer()}
            disabled={transferring || !transferDrinkId || transferQty <= 0}
            className="gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            {transferring ? tCommon("loading") : tStock("transferToConsumption")}
          </Button>
        </div>
      </div>

      <Input
        placeholder={t("searchStock")}
        value={search}
        onChange={(e) => search$.set(e.target.value)}
        className="mb-4"
      />

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("drinkColumn")}</TableHead>
              <TableHead>{t("quantityColumn")}</TableHead>
              <TableHead>{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredStock.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.drink_name}</TableCell>
                <TableCell>
                  {item.quantity <= LOW_STOCK_THRESHOLD ? (
                    <Badge variant="destructive">{item.quantity} 🔻</Badge>
                  ) : (
                    <Badge>{item.quantity}</Badge>
                  )}
                </TableCell>
                <TableCell className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(item)}
                    title={t("update")}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      setTransferDrinkId(item.drink_id);
                      setTransferQty(1);
                    }}
                    title={tStock("transferToConsumption")}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
