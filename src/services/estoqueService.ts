import { supabase } from "@/hooks/use-supabase";

const DRINK_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type EstoqueLogWithDrinkName = {
  id: string;
  drink: string;
  drink_id?: string;
  quantity: number;
  type: "entrada" | "saida";
  created_at: string;
  user?: string;
};

/**
 * Histórico de estoque: `estoque_log` guarda o id da bebida; o nome vem de `drinks.name`.
 */
export async function getEstoqueLogsWithDrinkNames(options?: {
  limit?: number;
}): Promise<EstoqueLogWithDrinkName[]> {
  let query = supabase
    .from("estoque_log")
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

/*
Buscar estoque com nome da bebida
*/
export async function getEstoque() {
  const { data, error } = await supabase
    .from("estoque")
    .select(`
      id,
      quantity,
      value_price,
      drink_id,
      drinks (
        id,
        name
      )
    `)
    .order("name", { foreignTable: "drinks", ascending: true });

  const formatted = Array.isArray(data)
    ? data.map((item) => ({
        id: item.id,
        drink_id: item.drink_id,
        drink_name: Array.isArray(item.drinks)
          ? item.drinks[0]?.name ?? ""
          : (item.drinks as any)?.name ?? "",
        quantity: item.quantity,
      }))
    : [];

  if (error) throw error;
  return formatted;
}

/*
Log de movimentação
*/
export async function logEstoque(
  drinkId: string,
  quantity: number,
  type: "entrada" | "saida",
  user: string = ""
) {
  await supabase.from("estoque_log").insert([
    {
      drink: drinkId,
      drink_id: drinkId,
      quantity,
      type,
      user,
    },
  ]);
}

/*
Adicionar ou atualizar estoque
*/
export async function addOrUpdateEstoque(
  drinkId: string,
  quantity: number,
  valuePrice: number | null = null
) {
  const { data: existing } = await supabase
    .from("estoque")
    .select("*")
    .eq("drink_id", drinkId)
    .single();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (existing) {
    await logEstoque(drinkId, quantity, "entrada", user?.email || "");

    const updateData: any = {
      quantity: existing.quantity + quantity,
    };

    if (valuePrice !== null) {
      updateData.value_price = valuePrice;
    }

    return await supabase
      .from("estoque")
      .update(updateData)
      .eq("id", existing.id);
  }

  await logEstoque(drinkId, quantity, "entrada", user?.email || "");

  const insertData: any = {
    drink: drinkId,
    drink_id: drinkId,
    quantity,
  };

  if (valuePrice !== null) {
    insertData.value_price = valuePrice;
  }

  return await supabase.from("estoque").insert([insertData]);
}

/*
Buscar estoque por bebida
*/
export async function getEstoqueByDrink(drinkId: string) {
  const { data, error } = await supabase
    .from("estoque")
    .select("quantity")
    .eq("drink_id", drinkId)
    .single();

  if (error || !data) return 0;

  return data.quantity || 0;
}

/*
Atualizar estoque manualmente
*/
export async function updateEstoque(id: string, quantity: number) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: item } = await supabase
    .from("estoque")
    .select("drink_id")
    .eq("id", id)
    .single();

  await logEstoque(item?.drink_id || "", quantity, "entrada", user?.email || "");

  return await supabase
    .from("estoque")
    .update({ quantity })
    .eq("id", id);
}

/*
Resolve drink_id: aceita UUID ou nome da bebida
*/
async function resolveDrinkId(drinkIdOrName: string): Promise<string> {
  if (DRINK_UUID_RE.test(drinkIdOrName)) return drinkIdOrName;

  const { data: drink, error } = await supabase
    .from("drinks")
    .select("id")
    .eq("name", drinkIdOrName)
    .maybeSingle();

  if (error || !drink?.id) {
    throw new Error("Bebida não encontrada");
  }
  return drink.id;
}

/*
Consumir estoque (venda)
- drinkIdOrName: UUID da bebida ou nome da bebida (como no Form)
*/
export async function consumirEstoque(
  drinkIdOrName: string,
  quantity: number,
  errorMessages?: {
    invalidDrinkOrQuantity?: string;
    insufficientStock?: string;
  }
) {
  const qty = Number(quantity);
  if (!drinkIdOrName || quantity === undefined || !Number.isFinite(qty) || qty <= 0) {
    throw new Error(
      errorMessages?.invalidDrinkOrQuantity ||
        "Bebida ou quantidade inválida"
    );
  }

  const drinkId = await resolveDrinkId(drinkIdOrName);

  const { data: item, error } = await supabase
    .from("estoque")
    .select("id, quantity")
    .eq("drink_id", drinkId)
    .single();

  if (error || !item || item.quantity < qty) {
    throw new Error(
      errorMessages?.insufficientStock ||
        "Estoque insuficiente"
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  await logEstoque(drinkId, -qty, "saida", user?.email || "");

  const { error: updateError } = await supabase
    .from("estoque")
    .update({
      quantity: item.quantity - qty,
    })
    .eq("id", item.id);

  if (updateError) {
    throw new Error(
      updateError.message || "Erro ao baixar estoque no servidor"
    );
  }
}

/**
 * Devolve quantidade ao estoque (ex.: rollback se gravar comanda falhar após consumo).
 */
export async function devolverEstoque(drinkIdOrName: string, quantity: number) {
  const qty = Number(quantity);
  if (!drinkIdOrName || !Number.isFinite(qty) || qty <= 0) return;
  const drinkId = await resolveDrinkId(drinkIdOrName);
  await addOrUpdateEstoque(drinkId, qty, null);
}

export async function getAllStock() {
  const { data, error } = await supabase
    .from("estoque")
    .select(`
      quantity,
      drinks (
        name
      )
    `);

  if (error) throw error;

  const map: Record<string, number> = {};

  data?.forEach((item: any) => {
    if (item.drinks?.name) {
      map[item.drinks.name] = item.quantity;
    }
  });

  return map;
}