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

export async function addOrUpdateEstoque(drink: string, quantity: number) {
  const { data: existing } = await supabase
    .from("estoque")
    .select("*")
    .eq("drink", drink)
    .single();

  const { data: { user } } = await supabase.auth.getUser();

  if (existing) {
    await logEstoque(drink, quantity, "entrada", user?.email || "");
    return await supabase
      .from("estoque")
      .update({ quantity: existing.quantity + quantity })
      .eq("id", existing.id);
  }

  await logEstoque(drink, quantity, "entrada", user?.email || "");
  return await supabase
    .from("estoque")
    .insert([{ drink, quantity }]);
}

export async function consumirEstoque(drink: string, quantidade: number) {
  if (!drink || quantidade === undefined) {
    throw new Error("Bebida ou quantidade inválida");
  }

  const { data: item, error } = await supabase
    .from("estoque")
    .select("id, quantity")
    .eq("drink", drink)
    .single();

  if (error || !item || item.quantity < quantidade) {
    throw new Error("Estoque insuficiente para " + drink);
  }

  const { data: { user } } = await supabase.auth.getUser();
  await logEstoque(drink, -quantidade, "saida", user?.email || "");

  return await supabase
    .from("estoque")
    .update({ quantity: item.quantity - quantidade })
    .eq("id", item.id);
}

