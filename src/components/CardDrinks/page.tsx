"use client";
import {
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
  useMemo,
  useState,
} from "react";
import { useObservable, useValue } from "@legendapp/state/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/utils/formatDateTime";
import { CheckCircle2, Download, FileText, XCircle } from "lucide-react";
import { supabase } from "@/hooks/use-supabase";
import { formatCurrency } from "@/utils/formatCurrency";
import { useLocale, useTranslations } from "next-intl";
import { message } from "@/lib/message";
import {
  exportDrinksReportExcel,
  exportDrinksReportPDF,
  getMonthRangeISO,
  type DrinkReportRow,
} from "@/lib/drinks-report-export";

interface Drink {
  id: string;
  created_at: string;
  name: string;
  drink: string;
  paid: boolean;
  paid_at: string | null;
  quantity: number;
  price: number;
  user: string;
  uuid: string;
}

interface Member {
  user_id: string;
  user_name: string;
}

const GENERAL_ADMIN_EMAILS = [
  "robson@gentlemenmc.com.br",
  "rodrigo@gentlemenmc.com.br",
] as const;

function isGeneralAdminEmail(email?: string | null): boolean {
  const normalized = email?.trim().toLowerCase() ?? "";
  return GENERAL_ADMIN_EMAILS.includes(
    normalized as (typeof GENERAL_ADMIN_EMAILS)[number]
  );
}

function getCurrentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export const CardCommand = forwardRef((_, ref) => {
  const t = useTranslations("cardDrinks");
  const locale = useLocale();
  const userData$ = useObservable<{ id: string; email?: string } | null>(null);
  const isAdmin$ = useObservable(false);
  const isGeneralAdmin$ = useObservable(false);
  const isBarMC$ = useObservable(false);
  const selectedUUID$ = useObservable<string | null>(null);
  const members$ = useObservable<Member[]>([]);
  const totalAmount$ = useObservable<number>(0);
  const drinksData$ = useObservable<Drink[]>([]);
  const todayBR$ = useObservable<string>("");
  const [reportMonth, setReportMonth] = useState(getCurrentMonthValue);
  const [exporting, setExporting] = useState(false);

  const userData = useValue(userData$);
  const isAdmin = useValue(isAdmin$);
  const isGeneralAdmin = useValue(isGeneralAdmin$);
  const isBarMC = useValue(isBarMC$);
  const selectedUUID = useValue(selectedUUID$);
  const members = useValue(members$);
  const totalAmount = useValue(totalAmount$);
  const drinksData = useValue(drinksData$);
  const todayBR = useValue(todayBR$);

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

  const exportTargetUuid = selectedUUID;
  const canExport = !isBarMC && !!exportTargetUuid && !!userData;

  const getReportLabels = useCallback(
    (year: number, month: number) => ({
      title: t("report.title"),
      member: t("report.member"),
      period: t("report.period"),
      totalSpent: t("report.totalSpent"),
      summaryByDrink: t("report.summaryByDrink"),
      details: t("report.details"),
      date: t("date"),
      drink: t("report.drink"),
      quantity: t("quantity"),
      value: t("value"),
      paid: t("paid"),
      markedBy: t("report.markedByColumn"),
      totalQuantity: t("report.totalQuantity"),
      totalValue: t("report.totalValue"),
      paidYes: t("report.paidYes"),
      paidNo: t("report.paidNo"),
      fileNamePdf: `relatorio_bebidas_${month}_${year}.pdf`,
      fileNameExcel: `relatorio_bebidas_${month}_${year}.xlsx`,
      sheetSummary: t("report.sheetSummary"),
      sheetDetails: t("report.sheetDetails"),
    }),
    [t]
  );

  const fetchUserData = async () => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    userData$.set(user);
    if (!user) return;

    const now = new Date();
    const brToday = now.toLocaleDateString("pt-BR");
    todayBR$.set(brToday);

    if (user.email === "barmc@gentlemenmc.com.br") {
      isAdmin$.set(true);
      isBarMC$.set(true);
      return;
    }

    const { data: admins } = await supabase
      .from("admins")
      .select("id")
      .eq("id", user.id)
      .eq("role", "admin");

    const adminStatus = !!(admins && admins.length > 0);
    const generalAdmin = isGeneralAdminEmail(user.email);
    isGeneralAdmin$.set(generalAdmin);
    isAdmin$.set(adminStatus || generalAdmin);

    if (adminStatus || generalAdmin) {
      const { data: membersData } = await supabase
        .from("membros")
        .select("user_id, user_name")
        .order("user_name", { ascending: true });

      members$.set(membersData || []);
    }

    if (generalAdmin) {
      return;
    }

    selectedUUID$.set(user.id);
  };

  const fetchDrinks = useCallback(
    async (uuid: string | null = null) => {
      drinksData$.set([]);
      totalAmount$.set(0);

      let query = supabase
        .from("bebidas")
        .select("created_at, name, drink, paid, paid_at, quantity, price, user, uuid")
        .order("created_at", { ascending: false });

      if (isBarMC) {
        const formatter = new Intl.DateTimeFormat("sv-SE", {
          timeZone: "America/Sao_Paulo",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
        const parts = formatter.formatToParts(new Date());
        const year = parts.find((p) => p.type === "year")?.value;
        const month = parts.find((p) => p.type === "month")?.value;
        const day = parts.find((p) => p.type === "day")?.value;
        const isoToday = `${year}-${month}-${day}`;

        const startOfDaySP = new Date(`${isoToday}T00:00:00-03:00`);
        const endOfDaySP = new Date(`${isoToday}T23:59:59-03:00`);

        query = query
          .gte("created_at", startOfDaySP.toISOString())
          .lte("created_at", endOfDaySP.toISOString());
      } else if (uuid) {
        query = query.eq("uuid", uuid);
      } else if (isGeneralAdmin) {
      } else {
        drinksData$.set([]);
        totalAmount$.set(0);
        return;
      }

      const { data: drinks } = await query.select();

      const total =
        drinks?.reduce(
          (sum: number, { paid, price }: { paid: boolean; price: number }) =>
            !paid ? sum + parseFloat(price.toString()) : sum,
          0
        ) || 0;

      drinksData$.set(drinks || []);
      totalAmount$.set(total);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isBarMC, isGeneralAdmin]
  );

  const fetchDrinksForMonth = async (
    uuid: string,
    year: number,
    month: number
  ): Promise<DrinkReportRow[]> => {
    const { start, end } = getMonthRangeISO(year, month);

    const { data, error } = await supabase
      .from("bebidas")
      .select("created_at, name, drink, paid, quantity, price, user, uuid")
      .eq("uuid", uuid)
      .gte("created_at", start)
      .lte("created_at", end)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const getReportContext = useCallback(() => {
    if (!exportTargetUuid) {
      message.warning(t("report.selectMemberFirst"));
      return null;
    }

    const [yearStr, monthStr] = reportMonth.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const periodLabel =
      monthOptions.find((option) => option.value === reportMonth)?.label ??
      reportMonth;
    const memberName =
      members.find((member) => member.user_id === exportTargetUuid)?.user_name ??
      drinksData.find((drink) => drink.uuid === exportTargetUuid)?.name ??
      exportTargetUuid;

    return {
      uuid: exportTargetUuid,
      year,
      month,
      periodLabel,
      memberName,
    };
  }, [
    drinksData,
    exportTargetUuid,
    members,
    monthOptions,
    reportMonth,
    t,
  ]);

  const handleExport = useCallback(
    async (format: "pdf" | "excel") => {
      const context = getReportContext();
      if (!context) return;

      setExporting(true);
      try {
        const drinks = await fetchDrinksForMonth(
          context.uuid,
          context.year,
          context.month
        );

        if (drinks.length === 0) {
          message.warning(t("report.noDataForMonth"));
          return;
        }

        const labels = getReportLabels(context.year, context.month);

        if (format === "pdf") {
          exportDrinksReportPDF(
            drinks,
            context.memberName,
            context.periodLabel,
            labels
          );
        } else {
          exportDrinksReportExcel(
            drinks,
            context.memberName,
            context.periodLabel,
            labels
          );
        }
      } catch {
        message.error(t("report.errorExporting"));
      } finally {
        setExporting(false);
      }
    },
    [getReportContext, getReportLabels, t]
  );

  useImperativeHandle(ref, () => ({
    refreshData: () => fetchDrinks(selectedUUID),
  }));

  useEffect(() => {
    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!userData) return;

    if (isBarMC || isGeneralAdmin) {
      fetchDrinks(selectedUUID);
    } else if (selectedUUID) {
      fetchDrinks(selectedUUID);
    }
  }, [selectedUUID, isBarMC, isGeneralAdmin, fetchDrinks, userData]);

  return (
    <div>
      {!isBarMC && isAdmin && (
        <div className="mb-4">
          <Select
            value={selectedUUID ?? (isGeneralAdmin ? "all" : "")}
            onValueChange={(value) =>
              selectedUUID$.set(value === "all" ? null : value)
            }
          >
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder={t("filterByUser")} />
            </SelectTrigger>
            <SelectContent>
              {isGeneralAdmin && (
                <SelectItem value="all">{t("allMembers")}</SelectItem>
              )}
              {members.map((member) => (
                <SelectItem key={member.user_id} value={member.user_id}>
                  {member.user_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {!isBarMC && userData && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Select value={reportMonth} onValueChange={setReportMonth}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder={t("report.selectMonth")} />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            disabled={!canExport || exporting}
            onClick={() => handleExport("pdf")}
          >
            <FileText className="h-4 w-4 mr-2" />
            {t("report.exportPdf")}
          </Button>

          <Button
            variant="outline"
            disabled={!canExport || exporting}
            onClick={() => handleExport("excel")}
          >
            <Download className="h-4 w-4 mr-2" />
            {t("report.exportExcel")}
          </Button>
        </div>
      )}

      {userData && (
        <div className="mb-4 text-lg font-semibold">
          {isBarMC
            ? t("markedDrinksToday", { date: todayBR })
            : t("unpaidTotal", { amount: formatCurrency(totalAmount) })}
        </div>
      )}

      {drinksData.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          {t("noDrinksMarked")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {drinksData.map((item) => (
            <Card
              key={
                item.id ||
                `${item.created_at}-${item.drink}-${item.name}-${item.uuid}`
              }
            >
              <CardHeader>
                <CardTitle>
                  {isBarMC || (isGeneralAdmin && !selectedUUID) ? (
                    <>
                      {item.drink}
                      <br />
                      {item.name}
                    </>
                  ) : (
                    item.drink
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">
                  {t("date")}: {formatDateTime(item.created_at)}
                </p>
                <p className="text-sm">
                  {t("quantity")}: {item.quantity}
                </p>
                <p className="text-sm">
                  {t("value")}: {formatCurrency(item.price)}
                </p>
                {!isBarMC && (
                  <p className="text-sm flex items-center gap-2">
                    {t("paid")}{" "}
                    {item.paid ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </p>
                )}
                {!isBarMC && item.paid && item.paid_at && (
                  <p className="text-sm">
                    {t("paidAt", { date: formatDateTime(item.paid_at) })}
                  </p>
                )}
                {!isBarMC && item.user && (
                  <p className="text-sm">
                    {t("markedBy", { user: item.user })}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
});

CardCommand.displayName = "CardCommand";
