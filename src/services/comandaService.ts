import { supabase } from "@/hooks/use-supabase.js";

type ComandaItem = {
  drink: string;
  quantity: number;
  price: number;
};

type RegisterComandaParams = {
  guestName?: string;
  memberName?: string;
  guestPhone?: string;
  items: ComandaItem[];
  errorMessage?: string;
  skipValidation?: boolean;
};

type ComandaItemUpdate = {
  id?: number; // id do item no banco, pode ser undefined para itens novos
  drink: string;
  quantity: number;
  price: number;
};

type UpdateComandaParams = {
  id: number; // id da comanda
  guestName: string;
  items: ComandaItemUpdate[];
};

export async function registerComanda({
  guestName,
  memberName,
  guestPhone,
  items,
  errorMessage,
  skipValidation,
}: RegisterComandaParams) {
  if (!skipValidation && (!guestName || !guestPhone || !memberName)) {
    throw new Error(errorMessage || "A comanda deve ter um nome de convidado, nome do integrante e telefone.");
  }

  // Criação da comanda
  const { data: comanda, error: comandaError } = await supabase
    .from("comandas")
    .insert([
      {
        nome_convidado: guestName || null,
        nome_integrante: memberName || null,
        telefone_convidado: guestPhone || null,
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (comandaError) throw comandaError;

  // Inserção dos itens da comanda
  const comandaItems = items.map((item) => ({
    comanda_id: comanda.id,
    bebida_nome: item.drink,
    quantidade: item.quantity,
    preco_unitario: item.price,
  }));

  const { error: itemsError } = await supabase
    .from("comanda_itens")
    .insert(comandaItems);

  if (itemsError) throw itemsError;

  return comanda;
}

export async function getComandas(date: Date | string) {
  const d = new Date(date);
  const startOfDay = new Date(d);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(d);
  endOfDay.setHours(23, 59, 59, 999);

  const { data: comandas, error } = await supabase
    .from("comandas")
    .select("*, comanda_itens!comanda_itens_comanda_id_fkey(*)")
    .gte("created_at", startOfDay.toISOString())
    .lte("created_at", endOfDay.toISOString())
    .order("created_at", { ascending: false });

  if (error) throw error;
  return comandas;
}

export async function updateComanda({ id, guestName, items }: UpdateComandaParams) {
  // 1. Atualizar o nome do convidado na comanda
  const { error: updateError } = await supabase
    .from("comandas")
    .update({ nome_convidado: guestName })
    .eq("id", id);

  if (updateError) throw updateError;

  // 2. Buscar os itens atuais no banco para essa comanda
  const { data: currentItems, error: fetchItemsError } = await supabase
    .from("comanda_itens")
    .select("*")
    .eq("comanda_id", id);

  if (fetchItemsError) throw fetchItemsError;

  // 3. Processar os itens enviados na atualização

  // Itens para inserir (não possuem id)
  const itemsToInsert = items.filter((item) => !item.id).map((item) => ({
    comanda_id: id,
    bebida_nome: item.drink,
    quantidade: item.quantity,
    preco_unitario: item.price,
  }));

  // Itens para atualizar (têm id)
  const itemsToUpdate = items.filter((item) => item.id).map((item) => ({
    id: item.id!,
    bebida_nome: item.drink,
    quantidade: item.quantity,
    preco_unitario: item.price,
  }));

  // Ids dos itens enviados para atualização/inserção
  const sentIds = items.filter((item) => item.id).map((item) => item.id);

  // Itens para deletar = itens atuais que não estão mais na lista enviada
  const itemsToDeleteIds = currentItems
    .filter((item) => !sentIds.includes(item.id))
    .map((item) => item.id);

  // 4. Executar operações em sequência

  // Deletar itens removidos
  if (itemsToDeleteIds.length > 0) {
    const { error: deleteError } = await supabase
      .from("comanda_itens")
      .delete()
      .in("id", itemsToDeleteIds);

    if (deleteError) throw deleteError;
  }

  // Atualizar itens existentes
  for (const item of itemsToUpdate) {
    const { error: updateItemError } = await supabase
      .from("comanda_itens")
      .update({
        bebida_nome: item.bebida_nome,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
      })
      .eq("id", item.id);

    if (updateItemError) throw updateItemError;
  }

  // Inserir novos itens
  if (itemsToInsert.length > 0) {
    const { error: insertError } = await supabase
      .from("comanda_itens")
      .insert(itemsToInsert);

    if (insertError) throw insertError;
  }

  return true; 
}

