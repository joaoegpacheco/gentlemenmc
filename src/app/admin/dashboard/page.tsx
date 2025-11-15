"use client";

import React, { useEffect } from "react";
import { useObservable, useValue } from "@legendapp/state/react";
import { useRouter } from "next/navigation";
import { supabase } from "@/hooks/use-supabase";
import { message } from "@/lib/message";
import type { SupabaseAuthUser } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { RefreshCw, LayoutDashboard } from "lucide-react";
import { StatsCards } from "@/components/Dashboard/StatsCards";
import { Charts } from "@/components/Dashboard/Charts";
import { QuickTables } from "@/components/Dashboard/QuickTables";
import {
  getDashboardStats,
  getReceitaMensal,
  getTopBebidas,
  getTopMembros,
  getMembrosComMaiorDivida,
  getUltimasComandasPagas,
  getMovimentacoesEstoque,
  getTendenciaConsumo,
  getAnaliseBebidasPorPeriodo,
  type DashboardStats,
  type ReceitaMensal,
  type TopBebida,
  type TopMembro,
  type DividaMembro,
  type UltimaComanda,
  type MovimentacaoEstoque,
  type TendenciaConsumo,
  type BebidaAnalise,
} from "@/services/dashboardService";

export default function DashboardPage() {
  const router = useRouter();
  const isAdmin$ = useObservable<boolean | null>(null);
  const loading$ = useObservable(true);
  const refreshing$ = useObservable(false);

  // Estados para os dados
  const stats$ = useObservable<DashboardStats | null>(null);
  const receitaMensal$ = useObservable<ReceitaMensal[]>([]);
  const topBebidas$ = useObservable<TopBebida[]>([]);
  const topMembros$ = useObservable<TopMembro[]>([]);
  const ultimasComandasPagas$ = useObservable<UltimaComanda[]>([]);
  const membrosComMaiorDivida$ = useObservable<DividaMembro[]>([]);
  const movimentacoesEstoque$ = useObservable<MovimentacaoEstoque[]>([]);
  const tendenciaConsumo$ = useObservable<TendenciaConsumo[]>([]);
  const bebidaAnalise$ = useObservable<BebidaAnalise[]>([]);
  const periodoAnalise$ = useObservable<"semana" | "mes" | "ano">("mes");

  // Valores observáveis
  const isAdmin = useValue(isAdmin$);
  const loading = useValue(loading$);
  const refreshing = useValue(refreshing$);
  const stats = useValue(stats$);
  const receitaMensal = useValue(receitaMensal$);
  const topBebidas = useValue(topBebidas$);
  const topMembros = useValue(topMembros$);
  const ultimasComandasPagas = useValue(ultimasComandasPagas$);
  const membrosComMaiorDivida = useValue(membrosComMaiorDivida$);
  const movimentacoesEstoque = useValue(movimentacoesEstoque$);
  const tendenciaConsumo = useValue(tendenciaConsumo$);
  const bebidaAnalise = useValue(bebidaAnalise$);
  const periodoAnalise = useValue(periodoAnalise$);

  useEffect(() => {
    checkAdminAndLoadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAdminAndLoadData = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user as SupabaseAuthUser | null;

      if (!user) {
        router.push("/");
        return;
      }

      const { data: admins } = await supabase
        .from("admins")
        .select("id")
        .eq("id", user.id)
        .eq("role", "admin");

      const adminStatus = !!(admins && admins.length > 0);
      isAdmin$.set(adminStatus);

      if (!adminStatus && user.email !== "barmc@gentlemenmc.com.br") {
        message.error(
          "Acesso negado. Apenas administradores podem acessar esta página."
        );
        router.push("/comandas");
        return;
      }

      await loadDashboardData();
    } catch (error) {
      console.error("Erro ao verificar permissões:", error);
      message.error("Erro ao carregar dashboard");
    }
  };

  const loadDashboardData = async () => {
    loading$.set(true);
    try {
      // Buscar todos os dados em paralelo
      const [
        statsData,
        receitaMensalData,
        topBebidasData,
        topMembrosData,
        ultimasComandasData,
        membrosComDividaData,
        movimentacoesData,
        tendenciaData,
        bebidaAnaliseData,
      ] = await Promise.all([
        getDashboardStats(),
        getReceitaMensal(12),
        getTopBebidas(5),
        getTopMembros(5),
        getUltimasComandasPagas(10),
        getMembrosComMaiorDivida(5),
        getMovimentacoesEstoque(10),
        getTendenciaConsumo(6),
        getAnaliseBebidasPorPeriodo(periodoAnalise$.peek()),
      ]);

      stats$.set(statsData);
      receitaMensal$.set(receitaMensalData);
      topBebidas$.set(topBebidasData);
      topMembros$.set(topMembrosData);
      ultimasComandasPagas$.set(ultimasComandasData);
      membrosComMaiorDivida$.set(membrosComDividaData);
      movimentacoesEstoque$.set(movimentacoesData);
      tendenciaConsumo$.set(tendenciaData);
      bebidaAnalise$.set(bebidaAnaliseData);
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

  const handlePeriodoChange = async (periodo: "semana" | "mes" | "ano") => {
    periodoAnalise$.set(periodo);
    try {
      const bebidaAnaliseData = await getAnaliseBebidasPorPeriodo(periodo);
      bebidaAnalise$.set(bebidaAnaliseData);
    } catch (error) {
      console.error("Erro ao atualizar análise de bebidas:", error);
      message.error("Erro ao atualizar análise de bebidas");
    }
  };

  if (isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
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
          receitaMensal={receitaMensal}
          topBebidas={topBebidas}
          topMembros={topMembros}
          tendenciaConsumo={tendenciaConsumo}
          bebidaAnalise={bebidaAnalise}
          loading={loading}
          onPeriodoChange={handlePeriodoChange}
          periodoAtual={periodoAnalise}
        />
      </section>

      {/* Quick Tables */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Atividades Recentes</h2>
        <QuickTables
          ultimasComandasPagas={ultimasComandasPagas}
          membrosComMaiorDivida={membrosComMaiorDivida}
          movimentacoesEstoque={movimentacoesEstoque}
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

