import { supabase } from "@/hooks/use-supabase.js";

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
    console.error("Erro ao buscar drinks:", error);
    return {};
  }

  const result: any = {};

  data?.forEach((drink: any) => {
    const categoryName = drink.categories?.name || "Outros";
    const categoryId = drink.categories?.id ?? drink.category_id ?? "";

    if (!result[categoryName]) {
      result[categoryName] = {
        id: categoryId,
        items: [],
        guests: {},
        members: {},
        stock: {},
      };
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

  return result;
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