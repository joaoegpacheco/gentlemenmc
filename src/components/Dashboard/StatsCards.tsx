"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DollarSign, 
  TrendingUp, 
  Receipt, 
  Package, 
  Users, 
  UserX,
  Cake
} from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import type { DashboardStats } from "@/services/dashboardService";
import Image from "next/image";
import { useTranslations } from 'next-intl';

interface StatsCardsProps {
  stats: DashboardStats;
  loading?: boolean;
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
  const t = useTranslations('statsCards');
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-4 w-4 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-32 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Debts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalDebts')}</CardTitle>
            <DollarSign className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.totalDebts)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('pendingPayment')}
            </p>
          </CardContent>
        </Card>

        {/* Month Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('monthRevenue')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.monthRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('currentMonth')}
            </p>
          </CardContent>
        </Card>

        {/* Open Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comandas em Aberto</CardTitle>
            <Receipt className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.openOrders}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Aguardando pagamento
            </p>
          </CardContent>
        </Card>

        {/* Low Stock Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('lowStock')}</CardTitle>
            <Package className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.lowStockItems}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('lessThan5Units')}
            </p>
          </CardContent>
        </Card>

        {/* Active Members */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('activeMembers')}</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.activeMembers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('activeStatus')}
            </p>
          </CardContent>
        </Card>

        {/* Inactive Members */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('inactiveMembers')}</CardTitle>
            <UserX className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {stats.inactiveMembers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('inactiveSuspended')}
            </p>
          </CardContent>
        </Card>

        {/* Upcoming Birthdays */}
        <Card className="sm:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('upcomingBirthdays')}
            </CardTitle>
            <Cake className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            {stats.upcomingBirthdays.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t('noUpcomingBirthdays')}
              </p>
            ) : (
              <div className="space-y-2">
                {stats.upcomingBirthdays.slice(0, 3).map((birthday, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {birthday.foto_url ? (
                      <Image
                        src={birthday.foto_url}
                        alt={birthday.user_name}
                        width={32}
                        height={32}
                        className="rounded-full w-8 h-8 object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-sm">
                          {birthday.user_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {birthday.user_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(birthday.data_nascimento).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "long",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                {stats.upcomingBirthdays.length > 3 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    + {stats.upcomingBirthdays.length - 3} {t('more')}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

