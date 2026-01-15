import { supabase } from "@/hooks/use-supabase";

export interface DashboardStats {
  totalDebts: number;
  monthRevenue: number;
  openOrders: number;
  lowStockItems: number;
  activeMembers: number;
  inactiveMembers: number;
  upcomingBirthdays: Array<{
    user_name: string;
    data_nascimento: string;
    foto_url?: string;
  }>;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  year: number;
}

export interface TopDrink {
  drink: string;
  quantity: number;
  revenue: number;
}

export interface TopMember {
  user_name: string;
  total_consumed: number;
  drinks_quantity: number;
  foto_url?: string;
}

export interface MemberDebt {
  user_name: string;
  debt: number;
  foto_url?: string;
}

export interface RecentOrder {
  id: number;
  guest_name: string;
  guest_phone: string;
  total: number;
  payment_date: string;
  created_at: string;
}

export interface StockMovement {
  id: number;
  drink: string;
  quantity: number;
  type: "entrada" | "saida";
  user: string;
  created_at: string;
}

export interface ConsumptionTrend {
  period: string;
  quantity: number;
  revenue: number;
}

export interface DrinkAnalysis {
  drink: string;
  quantity_sold: number;
  total_revenue: number;
  average_revenue_per_unit: number;
  profit_margin: number; // Percentual (receita / quantidade)
}

// Buscar estatísticas principais do dashboard
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // 1. Total de dívidas pendentes (bebidas não pagas)
    const { data: unpaidDrinks } = await supabase
      .from("bebidas")
      .select("price")
      .or("paid.is.null,paid.eq.false,paid.eq.0");
    
    const totalDebts = unpaidDrinks?.reduce((sum, b) => sum + (Number(b.price) || 0), 0) || 0;

    // 2. Receita do mês atual (bebidas pagas + comandas pagas)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const { data: paidDrinksThisMonth } = await supabase
      .from("bebidas")
      .select("price, created_at")
      .eq("paid", true)
      .gte("created_at", startOfMonth.toISOString())
      .lte("created_at", endOfMonth.toISOString());

    const { data: paidOrdersThisMonth } = await supabase
      .from("comandas")
      .select("comanda_itens(quantidade, preco_unitario), data_pagamento")
      .not("data_pagamento", "is", null)
      .gte("data_pagamento", startOfMonth.toISOString())
      .lte("data_pagamento", endOfMonth.toISOString());

    const drinksRevenue = paidDrinksThisMonth?.reduce((sum, b) => sum + (Number(b.price) || 0), 0) || 0;
    const ordersRevenue = paidOrdersThisMonth?.reduce((sum, c) => {
      const orderTotal = (c.comanda_itens as any[])?.reduce(
        (s, i) => s + (i.quantidade * i.preco_unitario), 
        0
      ) || 0;
      return sum + orderTotal;
    }, 0) || 0;

    const monthRevenue = drinksRevenue + ordersRevenue;

    // 3. Comandas em aberto (sem data de pagamento)
    const { count: openOrders } = await supabase
      .from("comandas")
      .select("*", { count: "exact", head: true })
      .is("data_pagamento", null);

    // 4. Itens com estoque baixo (menos de 5 unidades)
    const { count: lowStockItems } = await supabase
      .from("estoque")
      .select("*", { count: "exact", head: true })
      .lt("quantity", 5);

    // 5. Membros ativos e inativos
    const { count: activeMembers } = await supabase
      .from("membros")
      .select("*", { count: "exact", head: true })
      .or("status.eq.ativo,status.is.null");

    const { count: inactiveMembers } = await supabase
      .from("membros")
      .select("*", { count: "exact", head: true })
      .in("status", ["inativo", "suspenso"]);

    // 6. Próximos aniversariantes (próximos 7 dias)
    const today = new Date();
    const in7Days = new Date();
    in7Days.setDate(today.getDate() + 7);

    const { data: members } = await supabase
      .from("membros")
      .select("user_name, data_nascimento, foto_url")
      .not("data_nascimento", "is", null);

    const upcomingBirthdays = (members || [])
      .filter((m) => {
        if (!m.data_nascimento) return false;
        const birthDate = new Date(m.data_nascimento);
        const birthdayThisYear = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        
        return birthdayThisYear >= today && birthdayThisYear <= in7Days;
      })
      .sort((a, b) => {
        const dateA = new Date(a.data_nascimento);
        const dateB = new Date(b.data_nascimento);
        return dateA.getDate() - dateB.getDate();
      });

    return {
      totalDebts,
      monthRevenue,
      openOrders: openOrders || 0,
      lowStockItems: lowStockItems || 0,
      activeMembers: activeMembers || 0,
      inactiveMembers: inactiveMembers || 0,
      upcomingBirthdays,
    };
  } catch (error) {
    console.error("Erro ao buscar stats do dashboard:", error);
    throw error;
  }
}

// Buscar receita mensal histórica
export async function getMonthlyRevenue(monthsBack: number = 12, locale: string = "pt-BR"): Promise<MonthlyRevenue[]> {
  try {
    const result: MonthlyRevenue[] = [];
    const today = new Date();

    for (let i = monthsBack - 1; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);

      // Bebidas pagas no mês
      const { data: drinks } = await supabase
        .from("bebidas")
        .select("price")
        .eq("paid", true)
        .gte("created_at", startOfMonth.toISOString())
        .lte("created_at", endOfMonth.toISOString());

      // Comandas pagas no mês
      const { data: orders } = await supabase
        .from("comandas")
        .select("comanda_itens(quantidade, preco_unitario)")
        .not("data_pagamento", "is", null)
        .gte("data_pagamento", startOfMonth.toISOString())
        .lte("data_pagamento", endOfMonth.toISOString());

      const drinksRevenue = drinks?.reduce((sum, b) => sum + (Number(b.price) || 0), 0) || 0;
      const ordersRevenue = orders?.reduce((sum, c) => {
        const total = (c.comanda_itens as any[])?.reduce(
          (s, i) => s + (i.quantidade * i.preco_unitario),
          0
        ) || 0;
        return sum + total;
      }, 0) || 0;

      result.push({
        month: monthDate.toLocaleDateString(locale === "en" ? "en-US" : "pt-BR", { month: "short" }),
        revenue: drinksRevenue + ordersRevenue,
        year: monthDate.getFullYear(),
      });
    }

    return result;
  } catch (error) {
    console.error("Erro ao buscar receita mensal:", error);
    throw error;
  }
}

// Top 5 bebidas mais vendidas
export async function getTopDrinks(limit: number = 5, fallbackNoName: string = "Sem nome"): Promise<TopDrink[]> {
  try {
    // Bebidas da tabela "bebidas"
    const { data: drinks } = await supabase
      .from("bebidas")
      .select("drink, price");

    // Itens de comandas
    const { data: orderItems } = await supabase
      .from("comanda_itens")
      .select("bebida_nome, quantidade, preco_unitario");

    // Agregar dados
    const drinksMap = new Map<string, { quantity: number; revenue: number }>();

    drinks?.forEach((b) => {
      const drink = b.drink || "Sem nome";
      const current = drinksMap.get(drink) || { quantity: 0, revenue: 0 };
      drinksMap.set(drink, {
        quantity: current.quantity + 1,
        revenue: current.revenue + (Number(b.price) || 0),
      });
    });

    orderItems?.forEach((i) => {
      const drink = i.bebida_nome || "Sem nome";
      const current = drinksMap.get(drink) || { quantity: 0, revenue: 0 };
      drinksMap.set(drink, {
        quantity: current.quantity + i.quantidade,
        revenue: current.revenue + (i.quantidade * i.preco_unitario),
      });
    });

    // Converter para array e ordenar
    const result = Array.from(drinksMap.entries())
      .map(([drink, data]) => ({
        drink,
        quantity: data.quantity,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit);

    return result;
  } catch (error) {
    console.error("Erro ao buscar top bebidas:", error);
    throw error;
  }
}

// Top 5 membros que mais consomem
export async function getTopMembers(limit: number = 5, fallbackUnknown: string = "Desconhecido"): Promise<TopMember[]> {
  try {
    const { data: members } = await supabase
      .from("membros")
      .select("user_id, user_name, foto_url");

    const { data: drinks } = await supabase
      .from("bebidas")
      .select("uuid, price");

    // Agregar por membro
    const membersMap = new Map<string, { total_consumed: number; drinks_quantity: number }>();

    drinks?.forEach((b) => {
      const current = membersMap.get(b.uuid) || { total_consumed: 0, drinks_quantity: 0 };
      membersMap.set(b.uuid, {
        total_consumed: current.total_consumed + (Number(b.price) || 0),
        drinks_quantity: current.drinks_quantity + 1,
      });
    });

    // Combinar com informações dos membros
    const result = Array.from(membersMap.entries())
      .map(([user_id, data]) => {
        const member = members?.find((m) => m.user_id === user_id);
        return {
          user_name: member?.user_name || "Desconhecido",
          foto_url: member?.foto_url,
          total_consumed: data.total_consumed,
          drinks_quantity: data.drinks_quantity,
        };
      })
      .sort((a, b) => b.total_consumed - a.total_consumed)
      .slice(0, limit);

    return result;
  } catch (error) {
    console.error("Erro ao buscar top membros:", error);
    throw error;
  }
}

// Membros com maior dívida
export async function getMembersWithHighestDebt(limit: number = 5, fallbackUnknown: string = "Desconhecido"): Promise<MemberDebt[]> {
  try {
    const { data: members } = await supabase
      .from("membros")
      .select("user_id, user_name, foto_url");

    const { data: drinks } = await supabase
      .from("bebidas")
      .select("uuid, price")
      .or("paid.is.null,paid.eq.false,paid.eq.0");

    // Agregar dívidas por membro
    const debtsMap = new Map<string, number>();

    drinks?.forEach((b) => {
      const current = debtsMap.get(b.uuid) || 0;
      debtsMap.set(b.uuid, current + (Number(b.price) || 0));
    });

    // Combinar com informações dos membros
    const result = Array.from(debtsMap.entries())
      .map(([user_id, debt]) => {
        const member = members?.find((m) => m.user_id === user_id);
        return {
          user_name: member?.user_name || fallbackUnknown,
          foto_url: member?.foto_url,
          debt,
        };
      })
      .filter((m) => m.debt > 0)
      .sort((a, b) => b.debt - a.debt)
      .slice(0, limit);

    return result;
  } catch (error) {
    console.error("Erro ao buscar membros com maior dívida:", error);
    throw error;
  }
}

// Últimas comandas pagas
export async function getRecentPaidOrders(limit: number = 10, fallbackNoName: string = "Sem nome"): Promise<RecentOrder[]> {
  try {
    const { data: orders } = await supabase
      .from("comandas")
      .select("id, nome_convidado, telefone_convidado, data_pagamento, created_at, comanda_itens(quantidade, preco_unitario)")
      .not("data_pagamento", "is", null)
      .order("data_pagamento", { ascending: false })
      .limit(limit);

    const result = orders?.map((c) => {
      const total = (c.comanda_itens as any[])?.reduce(
        (sum, i) => sum + (i.quantidade * i.preco_unitario),
        0
      ) || 0;

      return {
        id: c.id,
        guest_name: c.nome_convidado || "Sem nome",
        guest_phone: c.telefone_convidado || "",
        total,
        payment_date: c.data_pagamento || "",
        created_at: c.created_at || "",
      };
    }) || [];

    return result;
  } catch (error) {
    console.error("Erro ao buscar últimas comandas pagas:", error);
    throw error;
  }
}

// Movimentações recentes de estoque
export async function getRecentStockMovements(limit: number = 10): Promise<StockMovement[]> {
  try {
    const { data } = await supabase
      .from("estoque_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    return data || [];
  } catch (error) {
    console.error("Erro ao buscar movimentações de estoque:", error);
    throw error;
  }
}

// Tendência de consumo por período (últimos 6 meses)
export async function getConsumptionTrend(monthsBack: number = 6, locale: string = "pt-BR"): Promise<ConsumptionTrend[]> {
  try {
    const result: ConsumptionTrend[] = [];
    const today = new Date();

    for (let i = monthsBack - 1; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);

      // Bebidas do mês
      const { data: drinks } = await supabase
        .from("bebidas")
        .select("price")
        .gte("created_at", startOfMonth.toISOString())
        .lte("created_at", endOfMonth.toISOString());

      // Comandas do mês
      const { data: orders } = await supabase
        .from("comandas")
        .select("comanda_itens(quantidade, preco_unitario)")
        .gte("created_at", startOfMonth.toISOString())
        .lte("created_at", endOfMonth.toISOString());

      const drinksQuantity = drinks?.length || 0;
      const ordersQuantity = orders?.reduce((sum, c) => {
        return sum + ((c.comanda_itens as any[])?.reduce((s, i) => s + i.quantidade, 0) || 0);
      }, 0) || 0;

      const drinksRevenue = drinks?.reduce((sum, b) => sum + (Number(b.price) || 0), 0) || 0;
      const ordersRevenue = orders?.reduce((sum, c) => {
        const total = (c.comanda_itens as any[])?.reduce(
          (s, i) => s + (i.quantidade * i.preco_unitario),
          0
        ) || 0;
        return sum + total;
      }, 0) || 0;

      result.push({
        period: monthDate.toLocaleDateString("pt-BR", { month: "short", year: "numeric" }),
        quantity: drinksQuantity + ordersQuantity,
        revenue: drinksRevenue + ordersRevenue,
      });
    }

    return result;
  } catch (error) {
    console.error("Erro ao buscar tendência de consumo:", error);
    throw error;
  }
}

// Análise de bebidas por período (semana, mês ou ano)
export async function getDrinkAnalysisByPeriod(
  period: "week" | "month" | "year",
  fallbackNoName: string = "Sem nome"
): Promise<DrinkAnalysis[]> {
  try {
    let startDate: Date;
    const today = new Date();

    switch (period) {
      case "week":
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case "month":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
    }

    // Buscar bebidas vendidas no período
    const { data: drinks } = await supabase
      .from("bebidas")
      .select("drink, price")
      .gte("created_at", startDate.toISOString());

    // Buscar itens de comandas vendidos no período
    const { data: orders } = await supabase
      .from("comandas")
      .select("comanda_itens(bebida_nome, quantidade, preco_unitario), created_at")
      .gte("created_at", startDate.toISOString());

    // Agregar dados por bebida
    const drinksMap = new Map<
      string,
      { quantity: number; revenue: number }
    >();

    // Processar bebidas da tabela "bebidas"
    drinks?.forEach((b) => {
      const drink = b.drink || fallbackNoName;
      const current = drinksMap.get(drink) || { quantity: 0, revenue: 0 };
      drinksMap.set(drink, {
        quantity: current.quantity + 1,
        revenue: current.revenue + (Number(b.price) || 0),
      });
    });

    // Processar itens de comandas
    orders?.forEach((c) => {
      (c.comanda_itens as any[])?.forEach((item) => {
        const drink = item.bebida_nome || fallbackNoName;
        const current = drinksMap.get(drink) || { quantity: 0, revenue: 0 };
        drinksMap.set(drink, {
          quantity: current.quantity + item.quantidade,
          revenue: current.revenue + (item.quantidade * item.preco_unitario),
        });
      });
    });

    // Converter para array e calcular métricas
    const result = Array.from(drinksMap.entries())
      .map(([drink, data]) => ({
        drink,
        quantity_sold: data.quantity,
        total_revenue: data.revenue,
        average_revenue_per_unit: data.quantity > 0 
          ? data.revenue / data.quantity 
          : 0,
        profit_margin: data.quantity > 0 
          ? (data.revenue / data.quantity) 
          : 0,
      }))
      .sort((a, b) => b.total_revenue - a.total_revenue);

    return result;
  } catch (error) {
    console.error("Erro ao buscar análise de bebidas por período:", error);
    throw error;
  }
}

