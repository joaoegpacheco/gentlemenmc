"use client";

import { useEffect, useMemo, useState } from "react";
import { useObservable, useValue } from "@legendapp/state/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Pencil, AlertTriangle } from "lucide-react";
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
  getEstoque,
  getEstoqueByDrink,
  transferirParaEstoqueConsumo,
  updateEstoque,
} from "@/services/estoqueService";
import { getEstoqueGlobalByDrink } from "@/services/estoqueGlobalService";
import { registrarPerdaConsumo } from "@/services/estoquePerdasService";
import { useDrinks } from "@/hooks/useDrinks";

type EstoqueType = {
  id: string;
  drink_id: string;
  drink_name: string;
  quantity: number;
};

const LOW_STOCK_THRESHOLD = 5;

export default function EstoquePage() {
  const { drinksByCategory } = useDrinks();
  const t = useTranslations("stock");
  const tCommon = useTranslations("common");

  const stock$ = useObservable<EstoqueType[]>([]);
  const drink$ = useObservable("");
  const quantity$ = useObservable<number>(1);
  const editingId$ = useObservable<string | null>(null);
  const loading$ = useObservable(false);
  const lossLoading$ = useObservable(false);
  const search$ = useObservable("");

  const stock = useValue(stock$);
  const drink = useValue(drink$);
  const quantity = useValue(quantity$);
  const editingId = useValue(editingId$);
  const loading = useValue(loading$);
  const lossLoading = useValue(lossLoading$);
  const search = useValue(search$);

  const [categoria, setCategoria] = useState("");
  const [editQuantity, setEditQuantity] = useState(0);

  const [lossCategoria, setLossCategoria] = useState("");
  const [lossDrink, setLossDrink] = useState("");
  const [lossQty, setLossQty] = useState(1);
  const [lossNotes, setLossNotes] = useState("");
  const [consumptionAvailable, setConsumptionAvailable] = useState<number | null>(null);

  async function fetchStock() {
    try {
      const data = await getEstoque();
      stock$.set(
        data.map((item) => ({
          id: item.id,
          drink_id: item.drink_id,
          drink_name: item.drink_name,
          quantity: item.quantity,
        }))
      );
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
      items?: { id: string; category_id: string; name: string }[];
    };
    return (Object.values(drinksByCategory || {}) as CategoryWithItems[])
      .flatMap((cat) => cat.items || [])
      .filter((d) => d.category_id === categoria)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [categoria, drinksByCategory]);

  const drinksFromCategoryLoss = useMemo(() => {
    if (!lossCategoria) return [];
    type CategoryWithItems = {
      items?: {
        id: string;
        category_id: string;
        name: string;
        cost_price?: number;
        price_member?: number;
        price_guest?: number;
      }[];
    };
    return (Object.values(drinksByCategory || {}) as CategoryWithItems[])
      .flatMap((cat) => cat.items || [])
      .filter((d) => d.category_id === lossCategoria)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [lossCategoria, drinksByCategory]);

  const lossPreview = useMemo(() => {
    if (!lossDrink || !lossCategoria) return null;
    const item = drinksFromCategoryLoss.find((d) => d.id === lossDrink);
    if (!item) return null;
    const catName = categories.find((c) => c.id === lossCategoria)?.name;
    const memberPrice = catName ? drinksByCategory?.[catName]?.members?.[item.name] ?? 0 : 0;
    const guestPrice = catName ? drinksByCategory?.[catName]?.guests?.[item.name] ?? 0 : 0;
    const q = lossQty > 0 ? lossQty : 0;
    return {
      cost: (item.cost_price ?? 0) * q,
      member: memberPrice * q,
      guest: guestPrice * q,
    };
  }, [lossDrink, lossQty, lossCategoria, drinksFromCategoryLoss, categories, drinksByCategory]);

  const effectiveConsumptionAvailable = lossDrink ? consumptionAvailable : null;

  useEffect(() => {
    if (!lossDrink) return;
    getEstoqueByDrink(lossDrink)
      .then(setConsumptionAvailable)
      .catch(() => setConsumptionAvailable(null));
  }, [lossDrink, stock]);

  const brlFormatter = useMemo(
    () => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }),
    []
  );

  const [globalAvailable, setGlobalAvailable] = useState<number | null>(null);
  const effectiveGlobalAvailable = drink && !editingId ? globalAvailable : null;

  useEffect(() => {
    if (!drink || editingId) return;
    getEstoqueGlobalByDrink(drink)
      .then(setGlobalAvailable)
      .catch(() => setGlobalAvailable(null));
  }, [drink, editingId]);

  const handleEdit = (item: EstoqueType) => {
    editingId$.set(item.id);
    drink$.set(item.drink_id);
    setEditQuantity(item.quantity);

    const catName = Object.keys(drinksByCategory).find((cat) =>
      drinksByCategory[cat].items.some((d: { id: string }) => d.id === item.drink_id)
    );
    if (catName) {
      const drinkItem = drinksByCategory[catName].items.find(
        (d: { id: string }) => d.id === item.drink_id
      );
      if (drinkItem) setCategoria(drinkItem.category_id);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    drink$.set("");
    quantity$.set(1);
    editingId$.set(null);
    setCategoria("");
    setEditQuantity(0);
    setGlobalAvailable(null);
  };

  const handleTransfer = async () => {
    if (!drink || quantity <= 0) {
      message.error(t("informDrinkAndQuantity"));
      return;
    }

    loading$.set(true);
    try {
      await transferirParaEstoqueConsumo(drink, quantity, null, {
        invalidDrinkOrQuantity: t("informDrinkAndQuantity"),
        insufficientGlobalStock: t("insufficientGlobalStock"),
      });
      message.success(t("transferredFromGlobal"));
      resetForm();
      await fetchStock();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : t("errorUpdatingStock"));
    } finally {
      loading$.set(false);
    }
  };

  const handleRegisterLoss = async () => {
    if (!lossDrink || lossQty <= 0) {
      message.error(t("informDrinkAndQuantity"));
      return;
    }

    lossLoading$.set(true);
    try {
      await registrarPerdaConsumo(lossDrink, lossQty, lossNotes, {
        invalid: t("informDrinkAndQuantity"),
        insufficientStock: t("lossInsufficientStock"),
      });
      message.success(t("lossRegistered", {
        remaining: Math.max(0, (effectiveConsumptionAvailable ?? 0) - lossQty),
      }));
      setLossDrink("");
      setLossCategoria("");
      setLossQty(1);
      setLossNotes("");
      await fetchStock();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : t("lossError"));
    } finally {
      lossLoading$.set(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId || editQuantity < 0) {
      message.error(t("informDrinkAndQuantity"));
      return;
    }

    loading$.set(true);
    try {
      await updateEstoque(editingId, editQuantity);
      message.success(t("stockUpdated"));
      resetForm();
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
        item.drink_name.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => a.drink_name.localeCompare(b.drink_name));
  }, [stock, search]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">{t("stockControl")}</h2>
      <p className="text-muted-foreground mb-6">{t("consumptionDescription")}</p>

      <div className="border p-4 rounded-xl shadow-sm mb-6 bg-card">
        {editingId ? (
          <>
            <h4 className="text-lg font-semibold mb-4">{t("editConsumption")}</h4>
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="text-sm text-muted-foreground">{t("quantityColumn")}</label>
                <Input
                  type="number"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(Number(e.target.value))}
                  className="w-24 mt-1"
                />
              </div>
              <Button onClick={handleSaveEdit} disabled={loading}>
                {loading ? tCommon("loading") : t("saveEdit")}
              </Button>
              <Button variant="ghost" onClick={resetForm}>
                {tCommon("cancel")}
              </Button>
            </div>
          </>
        ) : (
          <>
            <h4 className="text-lg font-semibold mb-1">{t("transferFromGlobal")}</h4>
            <p className="text-sm text-muted-foreground mb-4">{t("transferHint")}</p>
            <div className="flex flex-col md:flex-row gap-3 items-end flex-wrap">
              <div>
                <label className="text-sm text-muted-foreground">{t("selectCategory")}</label>
                <select
                  value={categoria}
                  onChange={(e) => {
                    setCategoria(e.target.value);
                    drink$.set("");
                    setGlobalAvailable(null);
                  }}
                  className="border rounded-md p-2 w-48 mt-1 block"
                >
                  <option value="">{t("selectCategory")}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">{t("selectDrink")}</label>
                <select
                  value={drink}
                  onChange={(e) => drink$.set(e.target.value)}
                  className="border rounded-md p-2 w-48 mt-1 block"
                  disabled={!categoria}
                >
                  <option value="">{t("selectDrink")}</option>
                  {drinksFromCategory.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">{t("quantityPlaceholder")}</label>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => quantity$.set(Number(e.target.value))}
                  className="w-24 mt-1"
                />
              </div>
              <Button
                onClick={handleTransfer}
                disabled={loading || !drink || quantity <= 0}
                className="gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                {loading ? tCommon("loading") : t("transferToConsumption")}
              </Button>
            </div>
            {effectiveGlobalAvailable !== null && drink && (
              <p className="text-sm text-muted-foreground mt-3">
                {t("globalAvailable", { quantity: effectiveGlobalAvailable })}
              </p>
            )}
          </>
        )}
      </div>

      {!editingId && (
        <div className="border border-destructive/30 p-4 rounded-xl shadow-sm mb-6 bg-card">
          <h4 className="text-lg font-semibold mb-1 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {t("registerLoss")}
          </h4>
          <p className="text-sm text-muted-foreground mb-4">{t("lossHint")}</p>
          <div className="flex flex-col md:flex-row gap-3 items-end flex-wrap">
            <div>
              <label className="text-sm text-muted-foreground">{t("selectCategory")}</label>
              <select
                value={lossCategoria}
                onChange={(e) => {
                  setLossCategoria(e.target.value);
                  setLossDrink("");
                }}
                className="border rounded-md p-2 w-48 mt-1 block"
              >
                <option value="">{t("selectCategory")}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">{t("selectDrink")}</label>
              <select
                value={lossDrink}
                onChange={(e) => setLossDrink(e.target.value)}
                className="border rounded-md p-2 w-48 mt-1 block"
                disabled={!lossCategoria}
              >
                <option value="">{t("selectDrink")}</option>
                {drinksFromCategoryLoss.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">{t("quantityPlaceholder")}</label>
              <Input
                type="number"
                min={1}
                value={lossQty}
                onChange={(e) => setLossQty(Number(e.target.value))}
                className="w-24 mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">{t("lossNotes")}</label>
              <Input
                value={lossNotes}
                onChange={(e) => setLossNotes(e.target.value)}
                placeholder={t("lossNotesPlaceholder")}
                className="w-48 mt-1"
              />
            </div>
            <Button
              variant="destructive"
              onClick={handleRegisterLoss}
              disabled={
                lossLoading ||
                !lossDrink ||
                lossQty <= 0 ||
                (effectiveConsumptionAvailable !== null && lossQty > effectiveConsumptionAvailable)
              }
            >
              {lossLoading ? tCommon("loading") : t("registerLossButton")}
            </Button>
          </div>
          {effectiveConsumptionAvailable !== null && lossDrink && (
            <p className="text-sm text-muted-foreground mt-3">
              {t("consumptionAvailable", { quantity: effectiveConsumptionAvailable })}
            </p>
          )}
          {lossPreview && lossDrink && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
              <p>
                <span className="text-muted-foreground">{t("lossPreviewCost")}: </span>
                <strong className="text-destructive">{brlFormatter.format(lossPreview.cost)}</strong>
              </p>
              <p>
                <span className="text-muted-foreground">{t("lossPreviewMember")}: </span>
                <strong>{brlFormatter.format(lossPreview.member)}</strong>
              </p>
              <p>
                <span className="text-muted-foreground">{t("lossPreviewGuest")}: </span>
                <strong>{brlFormatter.format(lossPreview.guest)}</strong>
              </p>
            </div>
          )}
        </div>
      )}

      <h4 className="text-lg font-semibold mb-3">{t("availableForSale")}</h4>
      <Input
        placeholder={t("searchStock")}
        value={search}
        onChange={(e) => search$.set(e.target.value)}
        className="mb-4 max-w-sm"
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
            {filteredStock.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  {t("emptyConsumption")}
                </TableCell>
              </TableRow>
            ) : (
              filteredStock.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.drink_name}</TableCell>
                  <TableCell>
                    {item.quantity <= LOW_STOCK_THRESHOLD ? (
                      <Badge variant="destructive">{item.quantity} 🔻</Badge>
                    ) : (
                      <Badge>{item.quantity}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(item)}
                      title={t("editConsumption")}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
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
