"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from 'next-intl';
import { useObservable, useValue } from "@legendapp/state/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FormCommand } from "@/components/Form/page";
import { CardCommand } from "@/components/CardDrinks/page";
import { CardCommandAll } from "@/components/CardDrinksAll/page";
// import { InvoiceTable } from "@/components/InvoiceTable/page";
// import { InvoiceForm } from "@/components/InvoiceForm/page";
// import { ChangePasswordForm } from "@/components/ChangePasswordForm/page";
import { LogoutButton } from "@/components/LogoutButton/page";
import dayjs from "dayjs";
import CalendarEvents from "../Calendar/page";
import ByLaw from "../ByLaw/page";
import { FormMonthlyFee } from "../FormMonthlyFee/page";
import { supabase } from "@/hooks/use-supabase";
import { PostgrestResponse } from "@supabase/supabase-js";
import { OpenComandasPageContent } from "@/components/OpenComandasPageContent/page";
import { PaidComandasPageContent } from "@/components/PaidComandasPageContent/page";
// import { CreditManager } from "../CreditManager/page";
import { UserProfileTab } from "../UserProfileTab/page";
import { ProspectsPage } from "../ProspectsPage/page";
import { ToolLoanForm } from "../ToolLoanForm/page";
import { NotificationBell } from "../NotificationBell/page";
import { appStore$ } from "@/stores/appStore";
import { syncEventNotifications } from "@/lib/sync-event-notifications";
import { isPaymentConfirmAllowedEmail } from "@/lib/payment-notify";
import { TabNavigationMenu } from "@/components/TabNavigationMenu/page";

// Keep the app store in the main bundle so dynamically loaded tab panels share one singleton.
void appStore$;

function TabPanelLoader() {
  const tCommon = useTranslations("common");
  return (
    <p className="py-8 text-center text-sm text-muted-foreground">
      {tCommon("loading")}
    </p>
  );
}

const dynamicTab = (loader: () => Promise<{ default: React.ComponentType }>) =>
  dynamic(loader, { loading: TabPanelLoader, ssr: false });

const CreateComandaPage = dynamicTab(() => import("@/app/[locale]/nova-comanda/page"));
const EstoqueGlobalPage = dynamicTab(() => import("@/app/[locale]/admin/estoque-global/page"));
const HistoricoEstoqueGlobalPage = dynamicTab(() => import("@/app/[locale]/admin/estoque-global/historico/page"));
const EstoquePage = dynamicTab(() => import("@/app/[locale]/admin/estoque/page"));
const HistoricoEstoquePage = dynamicTab(() => import("@/app/[locale]/admin/estoque/historico/page"));
const PerdasConsumoPage = dynamicTab(() => import("@/app/[locale]/admin/estoque/perdas/page"));
const MembrosPage = dynamicTab(() => import("@/app/[locale]/admin/membros/page"));
const DashboardTab = dynamicTab(() =>
  import("@/components/Dashboard/DashboardTab").then((m) => ({ default: m.DashboardTab }))
);
const OverviewFinancePage = dynamicTab(() => import("@/components/OverviewFinancePage/page"));
const ProspectValidationPage = dynamicTab(() => import("@/app/[locale]/admin/prospectos/validacao/page"));

interface AdminData {
  id: string;
}

interface Birthday {
  name: string;
  fullDate: string;
  day: string;
}

type TabItem =
  | { key: string; label: React.ReactNode; children: React.ReactNode }
  | { key: string; label: React.ReactNode };

function tabHasContent(tab: TabItem): tab is { key: string; label: React.ReactNode; children: React.ReactNode } {
  return "children" in tab;
}

export default function TabsComponent() {
  const t = useTranslations('tabs');
  const locale = useLocale();
  const admin$ = useObservable<boolean | null>(null);
  const manager$ = useObservable<boolean | null>(null);
  const isBarUser$ = useObservable<boolean>(false);
  const isFacilitiesUser$ = useObservable<boolean>(false);
  const caseType$ = useObservable<string | null>(null);
  const command$ = useObservable<boolean | null>(null);
  const birthdays$ = useObservable<Birthday[]>([]);
  const userEmail$ = useObservable<string | null>(null);

  const admin = useValue(admin$);
  const manager = useValue(manager$);
  const command = useValue(command$);
  const isBarUser = useValue(isBarUser$);
  const isFacilitiesUser = useValue(isFacilitiesUser$);
  const caseType = useValue(caseType$);
  const activeTab = useValue(appStore$.tabs.activeTab);
  const birthdays = useValue(birthdays$);
  const userEmail = useValue(userEmail$);

  const cardComandRef = useRef<any>(null);
  const comandAllTableRef = useRef<any>(null);
  const comandOpenTableRef = useRef<any>(null);
  const paidComandasTableRef = useRef<any>(null);
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(() => {
    const stored =
      typeof window !== "undefined"
        ? appStore$.tabs.activeTab.peek()
        : appStore$.tabs.activeTab.get();
    return new Set([stored || "1"]);
  });
  const [notifySyncVersion, setNotifySyncVersion] = useState(0);

  useEffect(() => {
    const checkIfUserIsAdmin = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) {
        window.location.href = "/";
        return;
      }

      userEmail$.set(user.email?.trim().toLowerCase() ?? "");

      isBarUser$.set(user.email === "barmc@gentlemenmc.com.br");
      manager$.set(
        user.email === "robson@gentlemenmc.com.br" ||
          user.email === "rodrigo@gentlemenmc.com.br"
      );
      isFacilitiesUser$.set(user.email === "guiotto@gentlemenmc.com.br");

      try {
        const { data: admins }: PostgrestResponse<AdminData> = await supabase
          .from("admins")
          .select("id")
          .eq("id", user.id)
          .eq("role", "admin");

        admin$.set(!!admins?.length);

        const { data: command }: PostgrestResponse<AdminData> = await supabase
        .from("admins")
        .select("id")
        .eq("id", user.id)
        .eq("role", "command");
        command$.set(!!command?.length);
        // Buscar case_type do membro
        const { data: memberData } = await supabase
          .from("membros")
          .select("case_type")
          .eq("user_id", user.id)
          .single();

        if (memberData?.case_type) {
          caseType$.set(memberData.case_type);
        } else {
          caseType$.set(null);
        }
      } catch (error) {
        console.error("Error fetching admin data:", error);
        admin$.set(false);
        caseType$.set(null);
      }

      try {
        await syncEventNotifications(locale === "en" ? "en" : "pt");
        setNotifySyncVersion((v) => v + 1);
      } catch (error) {
        console.error("Error syncing event notifications:", error);
      }
    };

    checkIfUserIsAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  useEffect(() => {
    const loadBirthdays = async () => {
      const { data, error } = await supabase
        .from("membros")
        .select("user_name, date_of_birth")
        .not("date_of_birth", "is", null)
        .order("user_name", { ascending: true });

      if (error) {
        console.error("Erro ao carregar aniversariantes:", error);
        birthdays$.set([]);
        return;
      }

      const currentMonth = new Date().getMonth();
      const list: Birthday[] = (data ?? [])
        .filter(
          (row) =>
            row.user_name &&
            row.date_of_birth &&
            dayjs(row.date_of_birth).month() === currentMonth
        )
        .map((row) => {
          const d = dayjs(row.date_of_birth);
          return {
            name: row.user_name as string,
            fullDate: d.format("YYYY-MM-DD"),
            day: d.format("DD"),
          };
        })
        .sort((a, b) => Number(a.day) - Number(b.day));

      birthdays$.set(list);
    };

    loadBirthdays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabChange = (key: string) => {
    appStore$.tabs.activeTab.set(key);
    setVisitedTabs((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    if (key === "2") cardComandRef.current?.refreshData();
    if (key === "10") comandAllTableRef.current?.refreshData();
    if (key === "13") comandOpenTableRef.current?.refreshData();
    if (key === "17") paidComandasTableRef.current?.refreshData();
  };

  const getCurrentTabs = (): TabItem[] => {
    // Verificar se o usuário pode ver a aba de prospects
    const canSeeProspectsTab = caseType === "Half" || caseType === "Prospect";
    const canSeeCommandValidationTab = caseType === "Diretoria" || caseType === "Full-Revisor";
    const canSeeConfirmPaymentTabAsCommand = isPaymentConfirmAllowedEmail(userEmail);

    const toolLoanTab = { key: "26", label: t('toolLoan'), children: <ToolLoanForm /> };

    if (admin) {
      const tabs = [
        { key: "1", label: t('mark'), children: <FormCommand /> },
        { key: "2", label: t('viewMarks'), children: <CardCommand ref={cardComandRef} /> },
        { key: "12", label: t('guestOrder'), children: <CreateComandaPage /> },
        { key: "5", label: t('events'), children: <CalendarEvents /> },
        { key: "6", label: t('statute'), children: <ByLaw /> },
        toolLoanTab,
        { key: "18", label: t('members'), children: <MembrosPage /> },
        { key: "20", label: t('dashboard'), children: <DashboardTab /> },
        { key: "9", label: t('confirmPayment'), children: <FormMonthlyFee /> },
        { key: "10", label: t('allDebts'), children: <CardCommandAll ref={comandAllTableRef} /> },
        { key: "13", label: t('openOrders'), children: <OpenComandasPageContent ref={comandOpenTableRef} /> },
        { key: "17", label: t('orderHistory'), children: <PaidComandasPageContent ref={paidComandasTableRef} /> },
        { key: "16", label: t('globalStock'), children: <EstoqueGlobalPage /> },
        { key: "24", label: t('globalStockHistory'), children: <HistoricoEstoqueGlobalPage /> },
        { key: "14", label: t('stock'), children: <EstoquePage /> },
        { key: "25", label: t('stockLosses'), children: <PerdasConsumoPage /> },
        { key: "15", label: t('stockHistory'), children: <HistoricoEstoquePage /> },
        { key: "23", label: t('finance'), children: <OverviewFinancePage /> },
        { key: "19", label: t('myProfile'), children: <UserProfileTab /> },
        // { key: "7", label: "Alterar senha", children: <ChangePasswordForm /> },
        { key: "11", label: <LogoutButton /> },
      ];

      // Adicionar aba de prospects apenas se for Half ou Prospect
      if (canSeeCommandValidationTab) {
        tabs.splice(1, 0, { key: "22", label: t('prospectValidation'), children: <ProspectValidationPage /> });
      }

      return tabs;
    } else if (command) {
      const tabs = [
        { key: "1", label: t('mark'), children: <FormCommand /> },
        { key: "2", label: t('viewMarks'), children: <CardCommand ref={cardComandRef} /> },
        { key: "5", label: t('events'), children: <CalendarEvents /> },
        { key: "6", label: t('statute'), children: <ByLaw /> },
        toolLoanTab,
        { key: "18", label: t('members'), children: <MembrosPage /> },
        { key: "10", label: t('allDebts'), children: <CardCommandAll ref={comandAllTableRef} /> },
        ...(canSeeConfirmPaymentTabAsCommand
          ? [{ key: "9", label: t('confirmPayment'), children: <FormMonthlyFee /> } as const,
            { key: "25", label: t('stockLosses'), children: <PerdasConsumoPage /> } as const,
            { key: "23", label: t('finance'), children: <OverviewFinancePage /> } as const,
          ]

          : []),
        { key: "19", label: t('myProfile'), children: <UserProfileTab /> },
        { key: "11", label: <LogoutButton /> },
      ];

      // Adicionar aba de prospects apenas se for Half ou Prospect
      if (canSeeCommandValidationTab) {
        tabs.splice(1, 0, { key: "22", label: t('prospectValidation'), children: <ProspectValidationPage /> });
      }

      return tabs;
    } else if (isBarUser) {
      return [
        { key: "1", label: t('mark'), children: <FormCommand /> },
        { key: "2", label: t('viewMarks'), children: <CardCommand ref={cardComandRef} /> },
        { key: "12", label: t('guestOrder'), children: <CreateComandaPage /> },
        { key: "13", label: t('openOrders'), children: <OpenComandasPageContent ref={comandOpenTableRef} /> },
        { key: "6", label: t('statute'), children: <ByLaw /> },
      ];
    } else if (isFacilitiesUser) {
      const tabs = [
        { key: "1", label: t('mark'), children: <FormCommand /> },
        { key: "2", label: t('viewMarks'), children: <CardCommand ref={cardComandRef} /> },
        { key: "5", label: t('events'), children: <CalendarEvents /> },
        { key: "16", label: t('globalStock'), children: <EstoqueGlobalPage /> },
        { key: "24", label: t('globalStockHistory'), children: <HistoricoEstoqueGlobalPage /> },
        { key: "14", label: t('stock'), children: <EstoquePage /> },
        { key: "25", label: t('stockLosses'), children: <PerdasConsumoPage /> },
        { key: "15", label: t('stockHistory'), children: <HistoricoEstoquePage /> },
        { key: "6", label: t('statute'), children: <ByLaw /> },
        toolLoanTab,
        { key: "19", label: t('myProfile'), children: <UserProfileTab /> },
        { key: "11", label: <LogoutButton /> },
      ];

      // Adicionar aba de prospects apenas se for Half ou Prospect
      if (canSeeProspectsTab) {
        tabs.splice(3, 0, { key: "21", label: t('prospects'), children: <ProspectsPage /> });
      }

      return tabs;
    } else if (manager) {
      const tabs = [
        { key: "1", label: t('mark'), children: <FormCommand /> },
        { key: "2", label: t('viewMarks'), children: <CardCommand ref={cardComandRef} /> },
        { key: "5", label: t('events'), children: <CalendarEvents /> },
        { key: "6", label: t('statute'), children: <ByLaw /> },
        toolLoanTab,
        { key: "16", label: t('globalStock'), children: <EstoqueGlobalPage /> },
        { key: "24", label: t('globalStockHistory'), children: <HistoricoEstoqueGlobalPage /> },
        { key: "14", label: t('stock'), children: <EstoquePage /> },
        { key: "25", label: t('stockLosses'), children: <PerdasConsumoPage /> },
        { key: "15", label: t('stockHistory'), children: <HistoricoEstoquePage /> },
        { key: "17", label: t('orderHistory'), children: <PaidComandasPageContent ref={paidComandasTableRef} /> },
        { key: "19", label: t('myProfile'), children: <UserProfileTab /> },
        // { key: "7", label: "Alterar senha", children: <ChangePasswordForm /> },
        { key: "11", label: <LogoutButton /> },
      ];
      // Adicionar aba de validação dos prospects apenas se for Diretoria ou Full-Revisor
      if (canSeeCommandValidationTab) {
        tabs.splice(1, 0, { key: "22", label: t('prospectValidation'), children: <ProspectValidationPage /> });
      }

      return tabs;
    } else {
      const tabs = [
        { key: "1", label: t('mark'), children: <FormCommand /> },
        { key: "2", label: t('viewMarks'), children: <CardCommand ref={cardComandRef} /> },
        { key: "5", label: t('events'), children: <CalendarEvents /> },
        { key: "6", label: t('statute'), children: <ByLaw /> },
        toolLoanTab,
        { key: "19", label: t('myProfile'), children: <UserProfileTab /> },
        // { key: "7", label: "Alterar senha", children: <ChangePasswordForm /> },
        { key: "11", label: <LogoutButton /> },
      ];

      // Adicionar aba de validação dos prospects apenas se for Diretoria ou Full-Revisor
      if (canSeeCommandValidationTab) {
        tabs.splice(1, 0, { key: "22", label: t('prospectValidation'), children: <ProspectValidationPage /> });
      }

      // Adicionar aba de prospects apenas se for Half ou Prospect
      if (canSeeProspectsTab) {
        tabs.splice(3, 0, { key: "21", label: t('prospects'), children: <ProspectsPage /> });
      }

      return tabs;
    }
  };

  const tabs = getCurrentTabs();
  const rolesResolved = admin !== null && command !== null;
  const validTabKeysKey = tabs.filter(tabHasContent).map((tab) => tab.key).join(",");

  useEffect(() => {
    if (!rolesResolved) return;

    const validKeys = validTabKeysKey.split(",");
    const current = appStore$.tabs.activeTab.peek();

    // Run outside the effect tick to satisfy react-hooks/set-state-in-effect.
    queueMicrotask(() => {
      if (!validKeys.includes(current)) {
        appStore$.tabs.activeTab.set("1");
        setVisitedTabs(new Set(["1"]));
        return;
      }

      setVisitedTabs((prev) => {
        if (prev.has(current)) return prev;
        const next = new Set(prev);
        next.add(current);
        return next;
      });
    });
  }, [rolesResolved, validTabKeysKey]);

  const birthdaysString = birthdays
    .map((birthday) => `${birthday.name} (${birthday.day})`)
    .join(", ");

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-start justify-between gap-3 pr-12 pb-3">
        <div>
          <p className="text-sm">{t('birthdaysOfMonth')} </p>
          <span className="text-sm font-semibold">
            {birthdaysString}
          </span>
        </div>
        <NotificationBell
          syncVersion={notifySyncVersion}
          onOpenToolLoanTab={() => handleTabChange("26")}
          onOpenCalendarTab={() => handleTabChange("5")}
        />
      </div>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        {!rolesResolved ? (
          <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
        ) : isBarUser ? (
          <TabsList className="flex-nowrap overflow-x-auto overflow-y-hidden w-full">
            {tabs.map((tab) => {
              if (!tabHasContent(tab)) {
                return (
                  <div key={tab.key} className="flex-shrink-0 ml-auto">
                    {tab.label}
                  </div>
                );
              }

              return (
                <TabsTrigger key={tab.key} value={tab.key} className="whitespace-nowrap flex-shrink-0">
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        ) : (
          <TabNavigationMenu
            tabs={tabs.map((tab) => ({ key: tab.key, label: tab.label }))}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        )}
        {tabs.filter(tabHasContent).map((tab) => (
          <TabsContent
            key={tab.key}
            value={tab.key}
            forceMount={visitedTabs.has(tab.key) || undefined}
            className="data-[state=inactive]:hidden"
          >
            {visitedTabs.has(tab.key) ? tab.children : null}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
