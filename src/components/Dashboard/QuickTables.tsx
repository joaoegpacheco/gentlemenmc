"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateTime } from "@/utils/formatDateTime";
import Image from "next/image";
import { ArrowUp, ArrowDown } from "lucide-react";
import { useTranslations } from 'next-intl';
import type {
  RecentOrder,
  MemberDebt,
  StockMovement,
} from "@/services/dashboardService";

interface QuickTablesProps {
  recentPaidOrders: RecentOrder[];
  membersWithHighestDebt: MemberDebt[];
  recentStockMovements: StockMovement[];
  loading?: boolean;
}

export function QuickTables({
  recentPaidOrders,
  membersWithHighestDebt,
  recentStockMovements,
  loading,
}: QuickTablesProps) {
  const t = useTranslations('quickTables');
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 w-48 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="h-12 bg-muted rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      {/* Recent Paid Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('recentPaidOrders')}</CardTitle>
        </CardHeader>
        <CardContent>
          {recentPaidOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t('noRecentPaidOrders')}
            </p>
          ) : (
            <div className="space-y-3">
              {recentPaidOrders.map((order) => (
                <div
                  key={order.id}
                  className="border rounded-lg p-3 space-y-1 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">
                          {order.guest_name}
                      </p>
                      {order.guest_phone && (
                        <p className="text-xs text-muted-foreground">
                          {order.guest_phone}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {formatCurrency(order.total)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>{t('paidOn')} {formatDateTime(order.payment_date)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Members with Highest Debt */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('highestDebts')}</CardTitle>
        </CardHeader>
        <CardContent>
          {membersWithHighestDebt.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t('noPendingDebts')}
            </p>
          ) : (
            <div className="space-y-3">
              {membersWithHighestDebt.map((member, idx) => (
                <div
                  key={idx}
                  className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
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
                        <span className="text-sm font-medium">
                          {member.user_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{member.user_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('pendingDebt')}
                      </p>
                    </div>
                    <Badge variant="destructive" className="font-semibold">
                      {formatCurrency(member.debt)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Stock Movements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('stockMovements')}</CardTitle>
        </CardHeader>
        <CardContent>
          {recentStockMovements.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t('noRecentMovements')}
            </p>
          ) : (
            <div className="space-y-3">
              {recentStockMovements.map((movement) => (
                <div
                  key={movement.id}
                  className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1">
                      {movement.type === "entrada" ? (
                        <ArrowUp className="h-4 w-4 text-green-500 mt-0.5" />
                      ) : (
                        <ArrowDown className="h-4 w-4 text-red-500 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-sm">{movement.drink}</p>
                        <p className="text-xs text-muted-foreground">
                          {movement.user || t('system')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={movement .type === "entrada" ? "default" : "secondary"}
                        className={
                          movement.type === "entrada"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-red-100 text-red-700 border-red-200"
                        }
                      >
                        {movement.type === "entrada" ? "+" : "-"}
                        {Math.abs(movement.quantity)}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(movement.created_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

