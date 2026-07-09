"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useObservable, useValue } from "@legendapp/state/react";
import { Download } from "lucide-react";

import { supabase } from "@/hooks/use-supabase";
import { message } from "@/lib/message";
import {
  exportFinanceOverviewExcel,
  exportFinanceOverviewFullExcel,
  getMonthRangeISO,
  isDrinkPaid,
  listMonthPeriods,
  type DrinkReportRow,
} from "@/lib/drinks-report-export";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateTime } from "@/utils/formatDateTime";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Member {
  user_id: string;
  user_name: string;
}

interface FinanceDrinkRow extends DrinkReportRow {
  id?: string | number;
}

function getCurrentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function OverviewFinancePage() {
  const t = useTranslations("overview");
  const locale = useLocale();

  const loading$ = useObservable(false);
  const exporting$ = useObservable<"month" | "full" | null>(null);
  const drinks$ = useObservable<FinanceDrinkRow[]>([]);
  const members$ = useObservable<Member[]>([]);
  const filterMonth$ = useObservable(getCurrentMonthValue());
  const filterMember$ = useObservable("all");

  const loading = useValue(loading$);
  const exporting = useValue(exporting$);
  const drinks = useValue(drinks$);
  const members = useValue(members$);
  const filterMonth = useValue(filterMonth$);
  const filterMember = useValue(filterMember$);

  const monthOptions = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, {
      month: "long",
      year: "numeric",
    });
    const options = [];
    const now = new Date();

    for (let i = 0; i < 24; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      options.push({ value, label: formatter.format(date) });
    }

    return options;
  }, [locale]);

  const fetchMembers = useCallback(async () => {
    const { data } = await supabase
      .from("membros")
      .select("user_id, user_name")
      .order("user_name", { ascending: true });

    members$.set(data || []);
  }, [members$]);

  const fetchDrinks = useCallback(async () => {
    loading$.set(true);

    try {
      const [yearStr, monthStr] = filterMonth.split("-");
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      const { start, end } = getMonthRangeISO(year, month);

      let query = supabase
        .from("bebidas")
        .select("id, created_at, name, drink, paid, quantity, price, user, uuid")
        .gte("created_at", start)
        .lte("created_at", end)
        .order("created_at", { ascending: false });

      if (filterMember !== "all") {
        query = query.eq("uuid", filterMember);
      }

      const { data, error } = await query;

      if (error) throw error;

      drinks$.set((data as FinanceDrinkRow[]) || []);
    } catch (err) {
      console.error(err);
      message.error(t("errorLoading"));
      drinks$.set([]);
    }

    loading$.set(false);
  }, [drinks$, filterMember, filterMonth, loading$, t]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    fetchDrinks();
  }, [fetchDrinks]);

  const totals = useMemo(() => {
    return drinks.reduce(
      (acc, drink) => {
        const value = parseFloat(drink.price?.toString() || "0") || 0;
        acc.total += value;
        if (isDrinkPaid(drink.paid)) {
          acc.paid += value;
        } else {
          acc.unpaid += value;
        }
        return acc;
      },
      { total: 0, paid: 0, unpaid: 0 }
    );
  }, [drinks]);

  const periodLabel =
    monthOptions.find((option) => option.value === filterMonth)?.label ??
    filterMonth;

  const exportLabels = useMemo(
    () => ({
      member: t("member"),
      date: t("date"),
      drink: t("drink"),
      quantity: t("quantity"),
      value: t("value"),
      paid: t("paymentStatus"),
      paidYes: t("paid"),
      paidNo: t("unpaid"),
      period: t("period"),
      total: t("total"),
      sheetDetails: t("sheetDetails"),
    }),
    [t]
  );

  const handleExportExcel = async () => {
    exporting$.set("month");

    try {
      const [yearStr, monthStr] = filterMonth.split("-");
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      const { start, end } = getMonthRangeISO(year, month);

      const { data, error } = await supabase
        .from("bebidas")
        .select("created_at, name, drink, paid, quantity, price, user, uuid")
        .gte("created_at", start)
        .lte("created_at", end)
        .order("name", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rows = (data as DrinkReportRow[]) || [];

      if (rows.length === 0) {
        message.warning(t("noDataForMonth"));
        return;
      }

      exportFinanceOverviewExcel(rows, periodLabel, {
        ...exportLabels,
        fileNameExcel: `visao_financeira_${month}_${year}.xlsx`,
      });
    } catch (err) {
      console.error(err);
      message.error(t("errorExporting"));
    } finally {
      exporting$.set(null);
    }
  };

  const handleExportFullExcel = async () => {
    exporting$.set("full");

    try {
      const now = new Date();
      const endYear = now.getFullYear();
      const endMonth = now.getMonth() + 1;
      const periods = listMonthPeriods(2025, 7, endYear, endMonth, locale);
      const { start } = getMonthRangeISO(2025, 7);
      const { end } = getMonthRangeISO(endYear, endMonth);

      const pageSize = 1000;
      const rows: DrinkReportRow[] = [];
      let from = 0;

      while (true) {
        const to = from + pageSize - 1;
        const { data, error } = await supabase
          .from("bebidas")
          .select("created_at, name, drink, paid, quantity, price, user, uuid")
          .gte("created_at", start)
          .lte("created_at", end)
          .order("created_at", { ascending: false })
          .range(from, to);

        if (error) throw error;

        const page = (data as DrinkReportRow[]) || [];
        rows.push(...page);

        if (page.length < pageSize) break;
        from += pageSize;
      }

      if (rows.length === 0) {
        message.warning(t("noDataForFullPeriod"));
        return;
      }

      exportFinanceOverviewFullExcel(rows, periods, {
        ...exportLabels,
        fileNameExcel: `visao_financeira_completa_jul2025_${endMonth}_${endYear}.xlsx`,
      });
    } catch (err) {
      console.error(err);
      message.error(t("errorExporting"));
    } finally {
      exporting$.set(null);
    }
  };

  const paymentBadge = (paid: boolean | null | undefined) =>
    isDrinkPaid(paid) ? (
      <Badge className="bg-green-600 hover:bg-green-600 text-white border-transparent">
        {t("paid")}
      </Badge>
    ) : (
      <Badge variant="destructive">{t("unpaid")}</Badge>
    );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("financialOverview")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("membersMonthlySubtitle")}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <Select value={filterMonth} onValueChange={filterMonth$.set}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder={t("selectMonth")} />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterMember} onValueChange={filterMember$.set}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder={t("filterByMember")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allMembers")}</SelectItem>
              {members.map((member) => (
                <SelectItem key={member.user_id} value={member.user_id}>
                  {member.user_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={handleExportExcel}
            disabled={!!exporting || loading}
            className="w-full sm:w-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            {exporting === "month" ? t("exporting") : t("exportExcel")}
          </Button>

          <Button
            variant="outline"
            onClick={handleExportFullExcel}
            disabled={!!exporting || loading}
            className="w-full sm:w-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            {exporting === "full" ? t("exporting") : t("exportExcelFull")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("total")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {formatCurrency(totals.total)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("paidTotal")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-green-700">
            {formatCurrency(totals.paid)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("unpaidTotal")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-red-700">
            {formatCurrency(totals.unpaid)}
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : drinks.length === 0 ? (
        <div className="text-center text-muted-foreground py-16 border rounded-lg">
          {t("noRecords")}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("member")}</TableHead>
                  <TableHead>{t("date")}</TableHead>
                  <TableHead>{t("drink")}</TableHead>
                  <TableHead className="text-right">{t("quantity")}</TableHead>
                  <TableHead className="text-right">{t("value")}</TableHead>
                  <TableHead>{t("paymentStatus")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drinks.map((drink, index) => (
                  <TableRow
                    key={
                      drink.id ??
                      `${drink.uuid}-${drink.created_at}-${drink.drink}-${index}`
                    }
                  >
                    <TableCell className="font-medium">{drink.name}</TableCell>
                    <TableCell>{formatDateTime(drink.created_at)}</TableCell>
                    <TableCell>{drink.drink}</TableCell>
                    <TableCell className="text-right">{drink.quantity}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(drink.price)}
                    </TableCell>
                    <TableCell>{paymentBadge(drink.paid)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {drinks.map((drink, index) => (
              <Card
                key={
                  drink.id ??
                  `${drink.uuid}-${drink.created_at}-${drink.drink}-${index}`
                }
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{drink.name}</CardTitle>
                    {paymentBadge(drink.paid)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-1.5 text-sm">
                  <p>
                    <span className="text-muted-foreground">{t("date")}: </span>
                    {formatDateTime(drink.created_at)}
                  </p>
                  <p>
                    <span className="text-muted-foreground">{t("drink")}: </span>
                    {drink.drink}
                  </p>
                  <p>
                    <span className="text-muted-foreground">
                      {t("quantity")}:{" "}
                    </span>
                    {drink.quantity}
                  </p>
                  <p>
                    <span className="text-muted-foreground">{t("value")}: </span>
                    {formatCurrency(drink.price)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
