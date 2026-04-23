import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { format } from "date-fns";
import { supabase } from "@/hooks/use-supabase";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Fuso para literais `::date` ao filtrar tabelas **que não** são `estoque_log` (ex.: `bebidas`).
 * Ajuste com `NEXT_PUBLIC_PG_DATE_SESSION_TZ` se o Postgres usar outro `TimeZone` nessas colunas.
 */
const PG_DATE_SESSION_TZ =
  process.env.NEXT_PUBLIC_PG_DATE_SESSION_TZ ?? "UTC";

/**
 * `estoque_log.created_at` é `timestamptz` alinhado ao uso de
 * `timezone('America/Sao_Paulo'::text, now())` no banco — os cortes de período para **geral**
 * usam sempre este fuso (não {@link PG_DATE_SESSION_TZ}).
 */
const ESTOQUE_LOG_DATE_TZ = "America/Sao_Paulo";

/**
 * `estoque_log`: `el.created_at >= 'início'::date AND el.created_at <= 'fim'::date`
 * em {@link ESTOQUE_LOG_DATE_TZ} — o `<=` usa a **meia-noite inicial** do dia `fim` (como o Postgres
 * promove `'Y-M-D'::date` para `timestamptz`), não o fim civil do dia nem `<` no dia seguinte.
 */
function reportRangeEstoqueLogPostgresDateCompare(
  startDate: Date,
  endDate: Date
): { gteIso: string; lteIso: string } {
  const ymdStart = format(startDate, "yyyy-MM-dd");
  const ymdEnd = format(endDate, "yyyy-MM-dd");
  const gteIso = dayjs
    .tz(ymdStart, ESTOQUE_LOG_DATE_TZ)
    .startOf("day")
    .toISOString();
  const lteIso = dayjs
    .tz(ymdEnd, ESTOQUE_LOG_DATE_TZ)
    .startOf("day")
    .toISOString();
  return { gteIso, lteIso };
}

/**
 * Espelha `created_at >= 'início'::date AND created_at <= 'fim'::date`:
 * ambos os limites são a **meia-noite inicial** de cada dia civil em {@link PG_DATE_SESSION_TZ},
 * não o fim do dia nem `CAST(created_at AS date)` (por isso difere de `<= fim` “o dia inteiro”).
 */
function reportRangeBebidasPostgresDateCompare(
  startDate: Date,
  endDate: Date
): { gteIso: string; lteIso: string } {
  const ymdStart = format(startDate, "yyyy-MM-dd");
  const ymdEnd = format(endDate, "yyyy-MM-dd");
  const gteIso = dayjs
    .tz(ymdStart, PG_DATE_SESSION_TZ)
    .startOf("day")
    .toISOString();
  const lteIso = dayjs
    .tz(ymdEnd, PG_DATE_SESSION_TZ)
    .startOf("day")
    .toISOString();
  return { gteIso, lteIso };
}

function drinkNameFromJoin(
  drinks: { name: string } | { name: string }[] | null | undefined
): string | null {
  const row = Array.isArray(drinks) ? drinks[0] : drinks;
  const n = row?.name?.trim();
  return n || null;
}

const DRINK_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** PostgREST costuma limitar ~1000 linhas por request; sem paginar, `sum` no cliente fica errado. */
const SUPABASE_SELECT_PAGE_SIZE = 1000;

type EstoqueLogSaidaRow = {
  quantity: unknown;
  drinks: { name: string } | { name: string }[] | null;
};

async function fetchAllEstoqueLogSaidasForAggregate(
  gteIso: string,
  lteIso: string
): Promise<EstoqueLogSaidaRow[]> {
  const all: EstoqueLogSaidaRow[] = [];
  let from = 0;
  for (;;) {
    const to = from + SUPABASE_SELECT_PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("estoque_log")
      .select("quantity, drinks!inner(name)")
      .eq("type", "saida")
      .gte("created_at", gteIso)
      .lte("created_at", lteIso)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to);

    if (error) throw error;
    if (!data?.length) break;
    all.push(...(data as EstoqueLogSaidaRow[]));
    if (data.length < SUPABASE_SELECT_PAGE_SIZE) break;
    from += SUPABASE_SELECT_PAGE_SIZE;
  }
  return all;
}

async function fetchAllBebidasForAggregate(
  gteIso: string,
  lteIso: string
): Promise<Array<{ drink: unknown; quantity: unknown }>> {
  const all: Array<{ drink: unknown; quantity: unknown }> = [];
  let from = 0;
  for (;;) {
    const to = from + SUPABASE_SELECT_PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("bebidas")
      .select("drink, quantity")
      .gte("created_at", gteIso)
      .lte("created_at", lteIso)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to);

    if (error) throw error;
    if (!data?.length) break;
    all.push(...data);
    if (data.length < SUPABASE_SELECT_PAGE_SIZE) break;
    from += SUPABASE_SELECT_PAGE_SIZE;
  }
  return all;
}

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

export type SaidaAgregadaPorBebida = {
  drink_name: string;
  quantidade_saida: number;
};

/**
 * Saídas agregadas por bebida a partir de `estoque_log` (tipo saida), no período.
 * Espelha o SQL com `join drinks`, `type = 'saida'`,
 * `el.created_at >= início::date`, `el.created_at <= fim::date` (sem `CAST` na coluna)
 * e `sum(el.quantity)`; fuso {@link ESTOQUE_LOG_DATE_TZ}.
 */
export async function getAggregatedSaidasEstoqueLog(
  startDate: Date,
  endDate: Date
): Promise<SaidaAgregadaPorBebida[]> {
  const { gteIso, lteIso } = reportRangeEstoqueLogPostgresDateCompare(
    startDate,
    endDate
  );

  const logs = await fetchAllEstoqueLogSaidasForAggregate(gteIso, lteIso);
  if (!logs.length) return [];

  const totals: Record<string, number> = {};
  for (const row of logs) {
    const r = row as {
      quantity: unknown;
      drinks: { name: string } | { name: string }[] | null;
    };
    const drinkName = drinkNameFromJoin(r.drinks);
    if (!drinkName) continue;
    const q = Number(r.quantity);
    if (!Number.isFinite(q)) continue;
    totals[drinkName] = (totals[drinkName] || 0) + q;
  }

  return Object.entries(totals)
    .map(([drink_name, quantidade_saida]) => ({
      drink_name,
      quantidade_saida,
    }))
    .sort((a, b) => b.quantidade_saida - a.quantidade_saida);
}

export type SaidaMembroAgregada = {
  drink: string;
  quantidade_saida: number;
};

/**
 * Agregado na tabela `bebidas` (membros): sem filtrar `paid`.
 * Janela como `created_at >= start::date AND created_at <= end::date` no Postgres
 * (teto em meia-noite **inicial** do dia final em {@link PG_DATE_SESSION_TZ}, não como `CAST(... AS date)`).
 */
export async function getAggregatedSaidasMembrosBebidas(
  startDate: Date,
  endDate: Date
): Promise<SaidaMembroAgregada[]> {
  const { gteIso, lteIso } = reportRangeBebidasPostgresDateCompare(
    startDate,
    endDate
  );

  const data = await fetchAllBebidasForAggregate(gteIso, lteIso);
  if (!data.length) return [];

  const totals: Record<string, number> = {};
  for (const row of data) {
    const d = (row.drink as string)?.trim();
    if (!d) continue;
    const q = Number(row.quantity);
    if (!Number.isFinite(q)) continue;
    totals[d] = (totals[d] || 0) + q;
  }

  return Object.entries(totals)
    .map(([drink, quantidade_saida]) => ({ drink, quantidade_saida }))
    .sort((a, b) => b.quantidade_saida - a.quantidade_saida);
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