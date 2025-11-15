"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { formatCurrency } from "@/utils/formatCurrency";
import Image from "next/image";
import type {
  MonthlyRevenue,
  TopDrink,
  TopMember,
  ConsumptionTrend,
  DrinkAnalysis,
} from "@/services/dashboardService";

interface ChartsProps {
  monthlyRevenue: MonthlyRevenue[];
  topDrinks: TopDrink[];
  topMembers: TopMember[];
  consumptionTrend: ConsumptionTrend[];
  drinkAnalysis?: DrinkAnalysis[];
  loading?: boolean;
  onPeriodChange?: (period: "week" | "month" | "year") => void;
  currentPeriod?: "week" | "month" | "year";
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export function Charts({
  monthlyRevenue,
  topDrinks,
  topMembers,
  consumptionTrend,
  drinkAnalysis = [],
  loading,
  onPeriodChange,
  currentPeriod = "month",
}: ChartsProps) {
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth()
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 w-48 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Filter monthly revenue for selected month
  const filteredRevenue =
    selectedMonth === -1
      ? monthlyRevenue
      : monthlyRevenue.filter((_, idx) => idx === selectedMonth);

  return (
    <div className="space-y-4">
      {/* Receita Mensal */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Receita Mensal</CardTitle>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value={-1}>Todos os meses</option>
              {monthlyRevenue.map((item, idx) => (
                <option key={idx} value={idx}>
                  {item.month} {item.year}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={filteredRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `R$ ${value}`}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="revenue" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top 5 Best Selling Drinks */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Bebidas Mais Vendidas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topDrinks} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                  dataKey="drink"
                  type="category"
                  width={100}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="quantity" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {topDrinks.map((drink, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="font-medium">{drink.drink}</span>
                  <span className="text-muted-foreground">
                    {drink.quantity} vendas - {formatCurrency(drink.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top 5 Members Who Consume Most */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Membros Consumidores</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topMembers as any}
                  dataKey="total_consumed"
                  nameKey="user_name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry: any) => entry.user_name}
                >
                  {topMembers.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-3">
              {topMembers.map((member, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  {member.foto_url ? (
                    <Image
                      src={member.foto_url}
                      alt={member.user_name}
                      width={40}
                      height={40}
                      className="rounded-full w-10 h-10 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-sm">
                        {member.user_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{member.user_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(member.total_consumed)} -{" "}
                      {member.drinks_quantity} bebidas
                    </p>
                  </div>
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Consumption Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Tendência de Consumo (Últimos 6 Meses)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={consumptionTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12 }}
                label={{
                  value: "Quantidade",
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: 12 },
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `R$ ${value}`}
                label={{
                  value: "Receita",
                  angle: 90,
                  position: "insideRight",
                  style: { fontSize: 12 },
                }}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  name === "revenue"
                    ? formatCurrency(value)
                    : `${value} units`,
                  name === "revenue" ? "Receita" : "Quantidade",
                ]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="quantity"
                stroke="#8884D8"
                strokeWidth={2}
                name="Quantidade"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="revenue"
                stroke="#00C49F"
                strokeWidth={2}
                name="Receita"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Drinks Investment Analysis */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Análise de Investimento em Bebidas</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Comparação entre receita total e volume de vendas por bebida
              </p>
            </div>
            <select
              value={currentPeriod}
              onChange={(e) => onPeriodChange?.(e.target.value as "week" | "month" | "year")}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="week">Última Semana</option>
              <option value="month">Este Mês</option>
              <option value="year">Este Ano</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={drinkAnalysis.slice(0, 10)}
              margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="bebida"
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12 }}
                label={{
                  value: "Quantidade Vendida",
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: 12 },
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(value)}
                label={{
                  value: "Receita Total",
                  angle: 90,
                  position: "insideRight",
                  style: { fontSize: 12 },
                }}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  name === "Receita Total"
                    ? formatCurrency(value)
                    : `${value} unidades`,
                  name,
                ]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="quantidade_vendida"
                fill="#8884D8"
                name="Quantidade Vendida"
              />
              <Bar
                yAxisId="right"
                dataKey="receita_total"
                fill="#00C49F"
                name="Receita Total"
              />
            </BarChart>
          </ResponsiveContainer>
          
          {/* Tabela detalhada */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-semibold">Bebida</th>
                  <th className="text-right py-2 px-2 font-semibold">Qtd. Vendida</th>
                  <th className="text-right py-2 px-2 font-semibold">Receita Total</th>
                  <th className="text-right py-2 px-2 font-semibold">Preço Médio</th>
                  <th className="text-right py-2 px-2 font-semibold">Potencial</th>
                </tr>
              </thead>
              <tbody>
                {drinkAnalysis.slice(0, 10).map((drink, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-2 font-medium">{drink.name}</td>
                    <td className="text-right py-2 px-2">{drink.sold_quantity}</td>
                    <td className="text-right py-2 px-2 font-semibold text-green-600">
                      {formatCurrency(drink.total_revenue)}
                    </td>
                    <td className="text-right py-2 px-2">
                      {formatCurrency(drink.average_revenue_per_unit)}
                    </td>
                    <td className="text-right py-2 px-2">
                      {drink.sold_quantity > 10 && drink.average_revenue_per_unit > 10 ? (
                        <span className="text-green-600 font-semibold">Alto</span>
                      ) : drink.sold_quantity > 5 || drink.average_revenue_per_unit > 8 ? (
                        <span className="text-yellow-600 font-semibold">Médio</span>
                      ) : (
                        <span className="text-gray-600">Baixo</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Insights */}
          {drinkAnalysis.length > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2 text-sm">💡 Insights de Investimento</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>
                  <strong className="text-foreground">Melhor Investimento:</strong>{" "}
                  {drinkAnalysis[0]?.name} - {formatCurrency(drinkAnalysis[0]?.total_revenue)} em receita
                </li>
                <li>
                  <strong className="text-foreground">Mais Vendido:</strong>{" "}
                  {[...drinkAnalysis].sort((a, b) => b.sold_quantity - a.sold_quantity)[0]?.name}
                  {" - "}
                  {[...drinkAnalysis].sort((a, b) => b.sold_quantity - a.sold_quantity)[0]?.sold_quantity} unidades
                </li>
                <li>
                  <strong className="text-foreground">Maior Valor Unitário:</strong>{" "}
                  {[...drinkAnalysis].sort((a, b) => b.average_revenue_per_unit - a.average_revenue_per_unit)[0]?.name}
                  {" - "}
                  {formatCurrency(
                    [...drinkAnalysis].sort((a, b) => b.average_revenue_per_unit - a.average_revenue_per_unit)[0]?.average_revenue_per_unit
                  )} por unidade
                </li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

