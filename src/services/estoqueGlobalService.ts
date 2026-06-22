import { supabase } from "@/hooks/use-supabase";

const DRINK_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type EstoqueGlobalLogWithDrinkName = {
  id: string;
  drink: string;
  drink_id?: string;
  quantity: number;
  type: "entrada" | "saida";
  created_at: string;
  user?: string;
};

export type EstoqueGlobalItem = {
  id: string;
  drink_id: string;
  drink_name: string;
  quantity: number;
};

async function logEstoqueGlobal(
  drinkId: string,
  quantity: number,
  type: "entrada" | "saida",
  user: string = ""
) {
  await supabase.from("estoque_global_log").insert([
    {
      drink: drinkId,
      drink_id: drinkId,
      quantity,
      type,
      user,
    },
  ]);
}

export async function getEstoqueGlobal(): Promise<EstoqueGlobalItem[]> {
  const { data, error } = await supabase
    .from("estoque_global")
    .select(`
      id,
      quantity,
      drink_id,
      drinks (
        id,
        name
      )
    `)
    .order("name", { foreignTable: "drinks", ascending: true });

  if (error) throw error;

  return (data ?? []).map((item) => ({
    id: item.id,
    drink_id: item.drink_id,
    drink_name: Array.isArray(item.drinks)
      ? item.drinks[0]?.name ?? ""
      : (item.drinks as { name?: string } | null)?.name ?? "",
    quantity: Number(item.quantity),
  }));
}

export async function getEstoqueGlobalByDrink(drinkId: string): Promise<number> {
  const { data, error } = await supabase
    .from("estoque_global")
    .select("quantity")
    .eq("drink_id", drinkId)
    .maybeSingle();

  if (error || !data) return 0;
  return Number(data.quantity) || 0;
}

export async function addOrUpdateEstoqueGlobal(
  drinkId: string,
  quantity: number,
  valuePrice: number | null = null
) {
  const qty = Number(quantity);
  if (!drinkId || !Number.isFinite(qty) || qty <= 0) {
    throw new Error("Bebida ou quantidade inválida");
  }

  const { data: existing } = await supabase
    .from("estoque_global")
    .select("*")
    .eq("drink_id", drinkId)
    .maybeSingle();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (existing) {
    await logEstoqueGlobal(drinkId, qty, "entrada", user?.email || "");

    const updateData: Record<string, unknown> = {
      quantity: Number(existing.quantity) + qty,
      updated_at: new Date().toISOString(),
    };

    if (valuePrice !== null) {
      updateData.value_price = valuePrice;
    }

    const { error } = await supabase
      .from("estoque_global")
      .update(updateData)
      .eq("id", existing.id);

    if (error) throw error;
    return;
  }

  await logEstoqueGlobal(drinkId, qty, "entrada", user?.email || "");

  const insertData: Record<string, unknown> = {
    drink: drinkId,
    drink_id: drinkId,
    quantity: qty,
  };

  if (valuePrice !== null) {
    insertData.value_price = valuePrice;
  }

  const { error } = await supabase.from("estoque_global").insert([insertData]);
  if (error) throw error;
}

export async function updateEstoqueGlobal(id: string, quantity: number) {
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty < 0) {
    throw new Error("Quantidade inválida");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: item } = await supabase
    .from("estoque_global")
    .select("drink_id, quantity")
    .eq("id", id)
    .single();

  if (!item?.drink_id) throw new Error("Item não encontrado");

  const diff = qty - Number(item.quantity);
  if (diff !== 0) {
    await logEstoqueGlobal(
      item.drink_id,
      diff,
      diff > 0 ? "entrada" : "saida",
      user?.email || ""
    );
  }

  const { error } = await supabase
    .from("estoque_global")
    .update({ quantity: qty, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

export async function getAllGlobalStock(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("estoque_global")
    .select(`
      quantity,
      drinks (
        name
      )
    `);

  if (error) throw error;

  const map: Record<string, number> = {};
  data?.forEach((item) => {
    const drinks = item.drinks as { name?: string } | { name?: string }[] | null;
    const name = Array.isArray(drinks) ? drinks[0]?.name : drinks?.name;
    if (name) {
      map[name] = Number(item.quantity);
    }
  });

  return map;
}

export async function getEstoqueGlobalLogsWithDrinkNames(options?: {
  limit?: number;
}): Promise<EstoqueGlobalLogWithDrinkName[]> {
  let query = supabase
    .from("estoque_global_log")
    .select("*")
    .order("created_at", { ascending: false });

  if (options?.limit != null) {
    query = query.limit(options.limit);
  }

  const { data: logs, error } = await query;
  if (error) throw error;
  if (!logs?.length) return [];

  const ids = new Set<string>();
  for (const row of logs) {
    const raw = (row as { drink_id?: string; drink?: string }).drink_id
      ?? (row as { drink?: string }).drink;
    if (typeof raw === "string" && DRINK_UUID_RE.test(raw)) {
      ids.add(raw);
    }
  }

  const nameById: Record<string, string> = {};
  if (ids.size > 0) {
    const { data: drinks } = await supabase
      .from("drinks")
      .select("id, name")
      .in("id", [...ids]);

    for (const d of drinks || []) {
      if (d.id) nameById[d.id] = d.name ?? "";
    }
  }

  return logs.map((row: Record<string, unknown>) => {
    const drinkId =
      (row.drink_id as string | undefined) ?? (row.drink as string | undefined);
    const isUuid =
      typeof drinkId === "string" && DRINK_UUID_RE.test(drinkId);
    const drinkLabel = isUuid
      ? nameById[drinkId] || drinkId
      : String((row.drink as string) || "");

    return {
      id: String(row.id),
      drink: drinkLabel,
      drink_id: drinkId,
      quantity: Number(row.quantity),
      type: row.type as "entrada" | "saida",
      created_at: String(row.created_at),
      user: row.user != null ? String(row.user) : undefined,
    };
  });
}
