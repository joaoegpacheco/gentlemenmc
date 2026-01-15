"use client";

import React, { useEffect } from "react";
import { useObservable, useValue } from "@legendapp/state/react";
import { message } from "@/lib/message";
import { Button } from "@/components/ui/button";
import { RefreshCw, LayoutDashboard } from "lucide-react";
import { StatsCards } from "./StatsCards";
import { Charts } from "./Charts";
import { QuickTables } from "./QuickTables";
import {
  getDashboardStats,
  getMonthlyRevenue,
  getTopDrinks,
  getTopMembers,
  getMembersWithHighestDebt,
  getRecentPaidOrders,
  getRecentStockMovements,
  getConsumptionTrend,
  getDrinkAnalysisByPeriod,
  type DashboardStats,
  type MonthlyRevenue,
  type TopDrink,
  type TopMember,
  type MemberDebt,
  type RecentOrder,
  type StockMovement,
  type ConsumptionTrend,
  type DrinkAnalysis,
} from "@/services/dashboardService";

export function DashboardTab() {
  const loading$ = useObservable(true);
  const refreshing$ = useObservable(false);

  // State for data
  const stats$ = useObservable<DashboardStats | null>(null);
  const monthlyRevenue$ = useObservable<MonthlyRevenue[]>([]);
  const topDrinks$ = useObservable<TopDrink[]>([]);
  const topMembers$ = useObservable<TopMember[]>([]);
  const recentPaidOrders$ = useObservable<RecentOrder[]>([]);
  const membersWithHighestDebt$ = useObservable<MemberDebt[]>([]);
  const recentStockMovements$ = useObservable<StockMovement[]>([]);
  const consumptionTrend$ = useObservable<ConsumptionTrend[]>([]);
  const drinkAnalysis$ = useObservable<DrinkAnalysis[]>([]);
  const analysisPeriod$ = useObservable<"week" | "month" | "year">("month");

  // Observable values
  const loading = useValue(loading$);
  const refreshing = useValue(refreshing$);
  const stats = useValue(stats$);
  const monthlyRevenue = useValue(monthlyRevenue$);
  const topDrinks = useValue(topDrinks$);
  const topMembers = useValue(topMembers$);
  const recentPaidOrders = useValue(recentPaidOrders$);
  const membersWithHighestDebt = useValue(membersWithHighestDebt$);
  const recentStockMovements = useValue(recentStockMovements$);
  const consumptionTrend = useValue(consumptionTrend$);
  const drinkAnalysis = useValue(drinkAnalysis$);
  const analysisPeriod = useValue(analysisPeriod$);

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboardData = async () => {
    loading$.set(true);
    try {
      // Fetch all data in parallel
      const [
        statsData,
        monthlyRevenueData,
        topDrinksData,
        topMembersData,
        recentPaidOrdersData,
        membersWithHighestDebtData,
        recentStockMovementsData,
        consumptionTrendData,
        drinkAnalysisData,
      ] = await Promise.all([
        getDashboardStats(),
        getMonthlyRevenue(12),
        getTopDrinks(5),
        getTopMembers(5),
        getRecentPaidOrders(10),
        getMembersWithHighestDebt(5),
        getRecentStockMovements(10),
        getConsumptionTrend(6),
        getDrinkAnalysisByPeriod(analysisPeriod$.get()),
      ]);

      stats$.set(statsData);
      monthlyRevenue$.set(monthlyRevenueData);
      topDrinks$.set(topDrinksData);
      topMembers$.set(topMembersData);
      recentPaidOrders$.set(recentPaidOrdersData);
      membersWithHighestDebt$.set(membersWithHighestDebtData);
      recentStockMovements$.set(recentStockMovementsData);
      consumptionTrend$.set(consumptionTrendData);
      drinkAnalysis$.set(drinkAnalysisData);
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
      message.error("Erro ao carregar dados do dashboard");
    } finally {
      loading$.set(false);
    }
  };

  const handleRefresh = async () => {
    refreshing$.set(true);
    try {
      await loadDashboardData();
      message.success("Dashboard atualizado com sucesso!");
    } catch (error) {
      message.error("Erro ao atualizar dashboard");
    } finally {
      refreshing$.set(false);
    }
  };

  const handlePeriodChange = async (period: "week" | "month" | "year") => {
    analysisPeriod$.set(period);
    try {
      const drinkAnalysisData = await getDrinkAnalysisByPeriod(period);
      drinkAnalysis$.set(drinkAnalysisData);
    } catch (error) {
      console.error("Erro ao atualizar análise de bebidas:", error);
      message.error("Erro ao atualizar análise de bebidas");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Visão geral das métricas e estatísticas do clube
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Resumo Geral</h2>
        {stats ? (
          <StatsCards stats={stats} loading={loading} />
        ) : (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando estatísticas...</p>
          </div>
        )}
      </section>

      {/* Charts */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Gráficos e Análises</h2>
        <Charts
          monthlyRevenue={monthlyRevenue}
          topDrinks={topDrinks}
          topMembers={topMembers}
          consumptionTrend={consumptionTrend}
          drinkAnalysis={drinkAnalysis}
          loading={loading}
          onPeriodChange={handlePeriodChange}
          currentPeriod={analysisPeriod}
        />
      </section>

      {/* Quick Tables */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Atividades Recentes</h2>
        <QuickTables
          recentPaidOrders={recentPaidOrders}
          membersWithHighestDebt={membersWithHighestDebt}
          recentStockMovements={recentStockMovements}
          loading={loading}
        />
      </section>

      {/* Footer Info */}
      <div className="text-center text-sm text-muted-foreground pt-4 border-t">
        <p>
          Última atualização:{" "}
          {new Date().toLocaleString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

