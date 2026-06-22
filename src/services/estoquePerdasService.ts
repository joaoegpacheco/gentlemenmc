import { supabase } from "@/hooks/use-supabase";

export type PerdaConsumoRow = {
  id: string;
  drink_id: string;
  drink_name: string;
  quantity: number;
  cost_price: number;
  price_member: number;
  price_guest: number;
  total_cost: number;
  total_member: number;
  total_guest: number;
  notes?: string;
  user?: string;
  created_at: string;
};

export type PerdasConsumoTotais = {
  quantity: number;
  total_cost: number;
  total_member: number;
  total_guest: number;
};

/**
 * Registra perda: baixa estoque de consumo + grava tabela de perdas + log.
 */
export async function registrarPerdaConsumo(
  drinkId: string,
  quantity: number,
  notes?: string,
  errorMessages?: {
    invalid?: string;
    insufficientStock?: string;
  }
): Promise<string> {
  const qty = Number(quantity);
  if (!drinkId || !Number.isFinite(qty) || qty <= 0) {
    throw new Error(errorMessages?.invalid || "Bebida ou quantidade inválida");
  }

  const { data: drink, error: drinkError } = await supabase
    .from("drinks")
    .select("id, cost_price, price_member, price_guest")
    .eq("id", drinkId)
    .single();

  if (drinkError || !drink) {
    throw new Error("Bebida não encontrada");
  }

  const { data: item, error: stockError } = await supabase
    .from("estoque")
    .select("id, quantity")
    .eq("drink_id", drinkId)
    .maybeSingle();

  const currentQty = Number(item?.quantity ?? 0);
  if (stockError || !item || currentQty < qty) {
    throw new Error(
      errorMessages?.insufficientStock || "Estoque de consumo insuficiente"
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userEmail = user?.email || "";

  const newQty = currentQty - qty;
  const { error: updateError } = await supabase
    .from("estoque")
    .update({
      quantity: newQty,
      updated_at: new Date().toISOString(),
    })
    .eq("id", item.id);

  if (updateError) {
    throw new Error(updateError.message || "Erro ao baixar estoque de consumo");
  }

  const { error: logError } = await supabase.from("estoque_log").insert([
    {
      drink: drinkId,
      drink_id: drinkId,
      quantity: -qty,
      type: "saida",
      user: `${userEmail} (perda)`,
    },
  ]);

  if (logError) {
    await supabase
      .from("estoque")
      .update({ quantity: currentQty })
      .eq("id", item.id);
    throw new Error(logError.message || "Erro ao registrar log de estoque");
  }

  const { data: perda, error: perdaError } = await supabase
    .from("estoque_perdas_consumo")
    .insert([
      {
        drink_id: drinkId,
        quantity: qty,
        cost_price: drink.cost_price ?? 0,
        price_member: drink.price_member ?? 0,
        price_guest: drink.price_guest ?? 0,
        notes: notes?.trim() || null,
        user: userEmail,
      },
    ])
    .select("id")
    .single();

  if (perdaError) {
    await supabase
      .from("estoque")
      .update({ quantity: currentQty })
      .eq("id", item.id);
    throw new Error(perdaError.message || "Erro ao registrar perda");
  }

  return String(perda.id);
}

export async function getPerdasConsumo(): Promise<PerdaConsumoRow[]> {
  const { data, error } = await supabase
    .from("estoque_perdas_consumo")
    .select(`
      id,
      drink_id,
      quantity,
      cost_price,
      price_member,
      price_guest,
      notes,
      user,
      created_at,
      drinks ( name )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const drinks = row.drinks as { name?: string } | { name?: string }[] | null;
    const name = Array.isArray(drinks) ? drinks[0]?.name : drinks?.name;
    const q = Number(row.quantity);
    const cost = Number(row.cost_price);
    const member = Number(row.price_member);
    const guest = Number(row.price_guest);

    return {
      id: String(row.id),
      drink_id: String(row.drink_id),
      drink_name: name ?? String(row.drink_id),
      quantity: q,
      cost_price: cost,
      price_member: member,
      price_guest: guest,
      total_cost: q * cost,
      total_member: q * member,
      total_guest: q * guest,
      notes: row.notes ?? undefined,
      user: row.user ?? undefined,
      created_at: String(row.created_at),
    };
  });
}

export function calcularTotaisPerdas(rows: PerdaConsumoRow[]): PerdasConsumoTotais {
  return rows.reduce(
    (acc, row) => ({
      quantity: acc.quantity + row.quantity,
      total_cost: acc.total_cost + row.total_cost,
      total_member: acc.total_member + row.total_member,
      total_guest: acc.total_guest + row.total_guest,
    }),
    { quantity: 0, total_cost: 0, total_member: 0, total_guest: 0 }
  );
}

export function calcularTotaisPorBebida(
  rows: PerdaConsumoRow[]
): Array<{
  drink_name: string;
  quantity: number;
  total_cost: number;
  total_member: number;
  total_guest: number;
}> {
  const map: Record<string, PerdasConsumoTotais & { drink_name: string }> = {};

  for (const row of rows) {
    if (!map[row.drink_name]) {
      map[row.drink_name] = {
        drink_name: row.drink_name,
        quantity: 0,
        total_cost: 0,
        total_member: 0,
        total_guest: 0,
      };
    }
    map[row.drink_name].quantity += row.quantity;
    map[row.drink_name].total_cost += row.total_cost;
    map[row.drink_name].total_member += row.total_member;
    map[row.drink_name].total_guest += row.total_guest;
  }

  return Object.values(map).sort((a, b) => b.total_cost - a.total_cost);
}
