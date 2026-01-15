import { supabase } from "@/hooks/use-supabase";

export async function getEstoque() {
  const { data, error } = await supabase
    .from("estoque")
    .select("*")
    .order("drink", { ascending: true });

  if (error) throw error;
  return data;
}

export async function logEstoque(drink: string, quantity: number, type: "entrada" | "saida", user: string = "") {
  await supabase.from("estoque_log").insert([
    {
      drink,
      quantity,
      type,
      user,
    },
  ]);
}

export async function addOrUpdateEstoque(drink: string, quantity: number, valuePrice: number | null = null) {
  const { data: existing } = await supabase
    .from("estoque")
    .select("*")
    .eq("drink", drink)
    .single();

  const { data: { user } } = await supabase.auth.getUser();

  if (existing) {
    await logEstoque(drink, quantity, "entrada", user?.email || "");
    const updateData: { quantity: number; value_price?: number | null } = { 
      quantity: existing.quantity + quantity 
    };
    if (valuePrice !== null) {
      updateData.value_price = valuePrice;
    }
    return await supabase
      .from("estoque")
      .update(updateData)
      .eq("id", existing.id);
  }

  await logEstoque(drink, quantity, "entrada", user?.email || "");
  const insertData: { drink: string; quantity: number; value_price?: number | null } = { 
    drink, 
    quantity 
  };
  if (valuePrice !== null) {
    insertData.value_price = valuePrice;
  }
  return await supabase
    .from("estoque")
    .insert([insertData]);
}

export async function getEstoqueByDrink(drink: string) {
  const { data, error } = await supabase
    .from("estoque")
    .select("quantity")
    .eq("drink", drink)
    .single();

  if (error || !data) {
    return 0;
  }

  return data.quantity || 0;
}

export async function consumirEstoque(
  drink: string, 
  quantity: number,
  errorMessages?: {
    invalidDrinkOrQuantity?: string;
    insufficientStock?: string;
  }
) {
  if (!drink || quantity === undefined) {
    throw new Error(errorMessages?.invalidDrinkOrQuantity || "Bebida ou quantidade inválida");
  }

  const { data: item, error } = await supabase
    .from("estoque")
    .select("id, quantity")
    .eq("drink", drink)
    .single();

  if (error || !item || item.quantity < quantity) {
    const errorMsg = errorMessages?.insufficientStock 
      ? errorMessages.insufficientStock.replace("{drink}", drink)
      : "Estoque insuficiente para " + drink;
    throw new Error(errorMsg);
  }

  const { data: { user } } = await supabase.auth.getUser();
  await logEstoque(drink, -quantity, "saida", user?.email || "");

  return await supabase
    .from("estoque")
    .update({ quantity: item.quantity - quantity })
    .eq("id", item.id);
}

