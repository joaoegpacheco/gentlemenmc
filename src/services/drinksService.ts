import { supabase } from "@/hooks/use-supabase.js";

/** Ordem de exibição (1…n) por nome da categoria; nomes de coluna variam no Supabase. */
async function loadCategorySortOrderByName(): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  for (const table of ["categories", "drink_categories"] as const) {
    const { data, error } = await supabase.from(table).select("*");
    if (error || !data?.length) continue;

    for (const row of data as Record<string, unknown>[]) {
      const name = row.name;
      if (typeof name !== "string" || !name) continue;
      const raw =
        row.order_by ??
        row.orderBy ??
        row.orderby ??
        row.sort_order ??
        row.position;
      const n =
        raw != null && raw !== ""
          ? Number(raw)
          : Number.MAX_SAFE_INTEGER;
      map.set(name, Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER);
    }
    return map;
  }
  return map;
}

type CreateDrinkInput = {
  name: string;
  categoryId: string;
  costPrice: number;
  priceMember: number;
  priceGuest: number;
};

export async function createDrink(data: CreateDrinkInput) {
  const { data: inserted, error } = await supabase
    .from("drinks")
    .insert([
      {
        name: data.name,
        category_id: data.categoryId,
        cost_price: data.costPrice,
        price_member: data.priceMember,
        price_guest: data.priceGuest,
      },
    ])
    .select("id")
    .single();

  if (error) throw error;

  return inserted;
}

export async function deleteDrink(drinkId: string) {
  if (!drinkId) throw new Error("ID da bebida é obrigatório");

  // Remover registros que referenciam a bebida (evita erro de FK)
  // estoque pode ter coluna "drink" ou "drink_id" conforme o schema
  await supabase.from("estoque").delete().eq("drink", drinkId);
  await supabase.from("estoque").delete().eq("drink_id", drinkId);
  await supabase.from("estoque_log").delete().eq("drink", drinkId);

  const { error } = await supabase.from("drinks").delete().eq("id", drinkId);
  if (error) throw error;
}

export async function getDrinks() {
  const { data, error } = await supabase
    .from("drinks")
    .select(`
      id,
      name,
      category_id,
      cost_price,
      price_member,
      price_guest,
      drink_categories(name)
    `)
    .order("name");

  if (error) throw error;

  return data;
}

export async function getDrinksByCategory() {
  const sortByCategoryName = await loadCategorySortOrderByName();

  const { data, error } = await supabase
    .from("drinks")
    .select(`
      id,
      name,
      category_id,
      cost_price,
      price_guest,
      price_member,
      categories (
        id,
        name
      ),
      estoque!estoque_drink_fk (
        quantity
      )
    `);

  if (error) {
    console.error(
      "Erro ao buscar drinks:",
      error,
      "message" in error ? (error as { message?: string }).message : "",
      JSON.stringify(error),
    );
    return {};
  }

  const result: any = {};

  data?.forEach((drink: any) => {
    const categoryName = drink.categories?.name || "Outros";
    const categoryId = drink.categories?.id ?? drink.category_id ?? "";
    const orderBy = sortByCategoryName.get(categoryName) ?? Number.MAX_SAFE_INTEGER;

    if (!result[categoryName]) {
      result[categoryName] = {
        id: categoryId,
        orderBy,
        items: [],
        guests: {},
        members: {},
        stock: {},
      };
    } else if (orderBy < (result[categoryName].orderBy ?? Number.MAX_SAFE_INTEGER)) {
      result[categoryName].orderBy = orderBy;
    }

    result[categoryName].items.push({
      id: drink.id,
      name: drink.name,
      category_id: categoryId,
      cost_price: drink.cost_price ?? 0,
    });

    result[categoryName].guests[drink.name] = drink.price_guest;
    result[categoryName].members[drink.name] = drink.price_member;

    result[categoryName].stock[drink.name] =
      drink.estoque?.[0]?.quantity ?? 0;
  });

  const sortedEntries = Object.entries(result).sort((a, b) => {
    const va = a[1] as { orderBy?: number };
    const vb = b[1] as { orderBy?: number };
    const ao = va.orderBy ?? Number.MAX_SAFE_INTEGER;
    const bo = vb.orderBy ?? Number.MAX_SAFE_INTEGER;
    if (ao !== bo) return ao - bo;
    return a[0].localeCompare(b[0], "pt-BR");
  });

  const sortedResult: typeof result = {};
  for (const [key, value] of sortedEntries) {
    const { orderBy: _orderBy, ...rest } = value as Record<string, unknown> & {
      orderBy?: number;
    };
    sortedResult[key] = rest as (typeof result)[string];
  }

  return sortedResult;
}

export function getGuestsPrices(drinksByCategory: any) {
  return Object.values(drinksByCategory).reduce((acc: any, category: any) => {
    return {
      ...acc,
      ...category.guests,
    };
  }, {});
}

export function getMembersPrices(drinksByCategory: any) {
  return Object.values(drinksByCategory).reduce((acc: any, category: any) => {
    return {
      ...acc,
      ...category.members,
    };
  }, {});
}