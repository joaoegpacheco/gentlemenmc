"use client";

import { useEffect, useMemo, useState } from "react";
import { useObservable, useValue } from "@legendapp/state/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash } from "lucide-react";
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
import { createDrink, deleteDrink } from "@/services/drinksService";
import { useDrinks } from "@/hooks/useDrinks";

const LOW_STOCK_THRESHOLD = 5;

export default function EstoquePage() {
  const { drinksByCategory } = useDrinks();

  const t = useTranslations("stock");
  const tCommon = useTranslations("common");
  const tDashboard = useTranslations("dashboard");

  const stock$ = useObservable<EstoqueType[]>([]);
  const category$ = useObservable("");
  const drink$ = useObservable("");
  const quantity$ = useObservable<number>(0);
  const editingId$ = useObservable<string | null>(null);
  const loading$ = useObservable(false);
  const search$ = useObservable("");

  const stock = useValue(stock$);
  const drink = useValue(drink$);
  const quantity = useValue(quantity$);
  const editingId = useValue(editingId$);
  const loading = useValue(loading$);
  const search = useValue(search$);

  const [categoria, setCategoria] = useState("");
  const [nome, setNome] = useState("");
  const [precoCusto, setPrecoCusto] = useState(0);
  const [precoMembro, setPrecoMembro] = useState(0);
  const [precoConvidado, setPrecoConvidado] = useState(0);
  const [isNewDrink, setIsNewDrink] = useState(false);

  // --- Fetch Estoque ---
  async function fetchStock() {
    try {
      const data = await getEstoque();
      stock$.set(
        data.map((item: any) => ({
          id: item.id,
          drink_id: item.drink_id,
          drink_name: item.drink_name,
          category_id: item.category_id || "",
          quantity: item.quantity,
        }))
      );

    } catch {
      message.error(t("errorFetchingStock"));
    }
  }

  useEffect(() => {
    fetchStock();
  }, []);

  // --- Categories List (ID + Name) ---
  const categories = useMemo(() => {
    return Object.entries(drinksByCategory || {}).map(([catName, catData]: any) => ({
      id: catData.id ?? "",
      name: catName,
    }));
  }, [drinksByCategory]);

  // --- Drinks from selected category ---
  const drinksFromCategory = useMemo(() => {
    if (!categoria) return [];
    return Object.values(drinksByCategory || {})
      .flatMap((cat: any) => cat.items || [])
      .filter((d: any) => d.category_id === categoria);
  }, [categoria, drinksByCategory]);

  const brlFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  function parseCurrency(value: string) {
    const numbers = value.replace(/\D/g, "");
    return Number(numbers) / 100;
  }

  // --- Edit Item ---
  const handleEdit = (item: EstoqueType) => {
    editingId$.set(item.id);
    drink$.set(item.drink_id);
    quantity$.set(item.quantity);
    setIsNewDrink(false);

    // Encontrar categoria e drink pelo drink_id
    const catName = Object.keys(drinksByCategory).find((cat) =>
      drinksByCategory[cat].items.some((d: any) => d.id === item.drink_id)
    );

    if (catName) {
      const drinkItem = drinksByCategory[catName].items.find(
        (d: any) => d.id === item.drink_id
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

  // --- Add / Update Estoque ---
  const handleAdd = async () => {
    if (quantity < 0) {
      message.error(t("informDrinkAndQuantity"));
      return;
    }

    if (!editingId && isNewDrink) {
      if (!categoria || !nome) {
        message.error("Informe categoria e nome da nova bebida");
        return;
      }
    } else if (!drink) {
      message.error(t("informDrinkAndQuantity"));
      return;
    }

    loading$.set(true);
    try {
      if (editingId) {
        await updateEstoque(editingId, quantity);
        message.success("Estoque atualizado");
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

        await addOrUpdateEstoque(drinkIdToUse, quantity, precoCusto);
        message.success(t("stockUpdated"));
      }

      drink$.set("");
      category$.set("");
      quantity$.set(0);
      editingId$.set(null);
      setCategoria("");
      setNome("");
      setPrecoCusto(0);
      setPrecoMembro(0);
      setPrecoConvidado(0);
      setIsNewDrink(false);

      await fetchStock();
    } catch {
      message.error(t("errorUpdatingStock"));
    } finally {
      loading$.set(false);
    }
  };

  // --- Delete Drink ---
  async function handleDeleteDrink(drinkId: string) {
    if (!confirm("Deseja realmente deletar essa bebida?")) return;
    try {
      await deleteDrink(drinkId);
      message.success("Bebida deletada");
      await fetchStock();
    } catch {
      message.error("Erro ao deletar bebida");
    }
  }

  // --- Filtered Stock ---
  const filteredStock = useMemo(() => {
    return stock
      .filter((item) =>
        item.drink_name.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => a.drink_name.localeCompare(b.drink_name));
  }, [stock, search]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">{t("stockControl")}</h2>

      {/* --- Form Add/Update --- */}
      <div className="border p-4 rounded-xl shadow-sm mb-6 bg-card">
        <h4 className="text-lg font-semibold mb-4">{t("addOrUpdateDrink")}</h4>
        <div className="flex flex-col md:flex-row gap-2 items-center flex-wrap md:justify-between">

          <div className="flex flex-col items-center gap-2">
          {/* Toggle nova bebida (apenas quando não está editando) */}
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
              Nova bebida
            </label>
            </div>
          )}

          {/* Categoria */}
          <select
            value={categoria}
            onChange={(e) => {
              setCategoria(e.target.value);
              category$.set(e.target.value);
              drink$.set("");
              setNome("");
              setPrecoCusto(0);
              setPrecoMembro(0);
              setPrecoConvidado(0);
              setIsNewDrink(false);
            }}
            className="border rounded-md p-2 w-48"
          >
            <option value="">Selecione categoria</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Drink */}
          {isNewDrink && !editingId ? (
            <Input
              placeholder="Nome da bebida"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-48"
              disabled={!categoria}
            />
          ) : (
            <select
              value={drink}
              onChange={(e) => {
                const selected = drinksFromCategory.find((d: any) => d.id === e.target.value);
                const catName = categories.find((c) => c.id === categoria)?.name;
                drink$.set(e.target.value);
                setNome(selected?.name || "");
                setPrecoCusto(selected?.cost_price ?? 0);
                setPrecoMembro(catName ? drinksByCategory?.[catName]?.members?.[selected?.name] ?? 0 : 0);
                setPrecoConvidado(catName ? drinksByCategory?.[catName]?.guests?.[selected?.name] ?? 0 : 0);
              }}
              className="border rounded-md p-2 w-48"
              disabled={!categoria}
            >
              <option value="">Selecione bebida</option>
              {drinksFromCategory.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}
          {/* Quantidade */}
          <div className="flex gap-2 items-center">
          <label className="flex items-center gap-2 text-sm">Quantidade</label>
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
          {/* Preços */}
          <label className="flex items-center gap-2 text-sm">Preço Custo</label>
          <Input
            placeholder="Preço custo"
            value={brlFormatter.format(precoCusto)}
            onChange={(e) => setPrecoCusto(parseCurrency(e.target.value))}
            className="w-32"
          />
          </div>
          <div>
          <label className="flex items-center gap-2 text-sm">Preço Membro</label>
          <Input
            placeholder="Preço membro"
            value={brlFormatter.format(precoMembro)}
            onChange={(e) => setPrecoMembro(parseCurrency(e.target.value))}
            className="w-32"
          />
          </div>
          <div>
          <label className="flex items-center gap-2 text-sm">Preço Convidado</label>
          <Input
            placeholder="Preço convidado"
            value={brlFormatter.format(precoConvidado)}
            onChange={(e) => setPrecoConvidado(parseCurrency(e.target.value))}
            className="w-32"
          />
          </div>
</div>
          <Button onClick={handleAdd} disabled={loading}>
            {loading ? tCommon("loading") : editingId ? "Atualizar" : tDashboard("addToStock")}
          </Button>
        </div>
      </div>

      {/* --- Table --- */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome da bebida</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Ações</TableHead>
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
                <TableCell className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(item)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteDrink(item.drink_id)}
                  >
                    <Trash className="h-4 w-4 text-red-500" />
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